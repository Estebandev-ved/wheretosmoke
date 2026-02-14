import { useState, useEffect, useCallback } from 'react';

/**
 * 🏆 ACHIEVEMENTS HOOK - Sistema de logros
 * 
 * Maneja progreso de logros y detección de desbloqueos
 */

export const ACHIEVEMENTS = {
    // Explorador
    EXPLORER_BRONZE: {
        id: 'EXPLORER_BRONZE',
        name: 'Explorador Novato',
        description: 'Visita 3 spots diferentes',
        icon: '🥉',
        tier: 'bronze',
        requirement: { type: 'spotsVisited', count: 3 }
    },
    EXPLORER_SILVER: {
        id: 'EXPLORER_SILVER',
        name: 'Explorador Experto',
        description: 'Visita 10 spots diferentes',
        icon: '🥈',
        tier: 'silver',
        requirement: { type: 'spotsVisited', count: 10 }
    },
    EXPLORER_GOLD: {
        id: 'EXPLORER_GOLD',
        name: 'Explorador Maestro',
        description: 'Visita 25 spots diferentes',
        icon: '🥇',
        tier: 'gold',
        requirement: { type: 'spotsVisited', count: 25 }
    },

    // Creador
    CREATOR_BRONZE: {
        id: 'CREATOR_BRONZE',
        name: 'Creador Principiante',
        description: 'Crea tu primer spot',
        icon: '🌱',
        tier: 'bronze',
        requirement: { type: 'spotsCreated', count: 1 }
    },
    CREATOR_SILVER: {
        id: 'CREATOR_SILVER',
        name: 'Creador Activo',
        description: 'Crea 5 spots',
        icon: '🌿',
        tier: 'silver',
        requirement: { type: 'spotsCreated', count: 5 }
    },
    CREATOR_GOLD: {
        id: 'CREATOR_GOLD',
        name: 'Creador Legendario',
        description: 'Crea 15 spots',
        icon: '🌳',
        tier: 'gold',
        requirement: { type: 'spotsCreated', count: 15 }
    },

    // Guardián
    GUARDIAN_BRONZE: {
        id: 'GUARDIAN_BRONZE',
        name: 'Guardián Verde',
        description: 'Vota RELAX 10 veces',
        icon: '🛡️',
        tier: 'bronze',
        requirement: { type: 'relaxVotes', count: 10 }
    },
    GUARDIAN_SILVER: {
        id: 'GUARDIAN_SILVER',
        name: 'Protector Zen',
        description: 'Vota RELAX 30 veces',
        icon: '⚔️',
        tier: 'silver',
        requirement: { type: 'relaxVotes', count: 30 }
    },
    GUARDIAN_GOLD: {
        id: 'GUARDIAN_GOLD',
        name: 'Maestro de Paz',
        description: 'Vota RELAX 100 veces',
        icon: '👑',
        tier: 'gold',
        requirement: { type: 'relaxVotes', count: 100 }
    }
};

const useAchievements = () => {
    const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
        const saved = localStorage.getItem('achievements');
        return saved ? JSON.parse(saved) : [];
    });

    const [progress, setProgress] = useState(() => {
        const saved = localStorage.getItem('achievementProgress');
        return saved ? JSON.parse(saved) : {
            spotsVisited: 0,
            spotsCreated: 0,
            relaxVotes: 0,
            tomboVotes: 0,
            comments: 0
        };
    });

    const [pendingUnlock, setPendingUnlock] = useState(null);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('achievements', JSON.stringify(unlockedAchievements));
    }, [unlockedAchievements]);

    useEffect(() => {
        localStorage.setItem('achievementProgress', JSON.stringify(progress));
    }, [progress]);

    // Check for new unlocks
    const checkAchievements = useCallback((newProgress) => {
        const achievements = Object.values(ACHIEVEMENTS);

        for (const achievement of achievements) {
            // Skip if already unlocked
            if (unlockedAchievements.includes(achievement.id)) continue;

            const { type, count } = achievement.requirement;

            if (newProgress[type] >= count) {
                // Find previous tier achievement if exists
                const previousAchievement = getPreviousTier(achievement);

                // Unlock new achievement
                setUnlockedAchievements(prev => [...prev, achievement.id]);
                setPendingUnlock({
                    achievement,
                    previousAchievement
                });

                return achievement;
            }
        }

        return null;
    }, [unlockedAchievements]);

    const getPreviousTier = (achievement) => {
        const category = achievement.id.split('_')[0]; // EXPLORER, CREATOR, GUARDIAN

        if (achievement.tier === 'silver') {
            return ACHIEVEMENTS[`${category}_BRONZE`];
        } else if (achievement.tier === 'gold') {
            return ACHIEVEMENTS[`${category}_SILVER`];
        }

        return null;
    };

    const updateProgress = useCallback((type, increment = 1) => {
        setProgress(prev => {
            const newProgress = {
                ...prev,
                [type]: prev[type] + increment
            };

            // Check for achievements after update
            setTimeout(() => checkAchievements(newProgress), 100);

            return newProgress;
        });
    }, [checkAchievements]);

    const clearPendingUnlock = useCallback(() => {
        setPendingUnlock(null);
    }, []);

    return {
        unlockedAchievements,
        progress,
        pendingUnlock,
        updateProgress,
        clearPendingUnlock,
        isUnlocked: (achievementId) => unlockedAchievements.includes(achievementId)
    };
};

export default useAchievements;
