import React, { createContext, useContext } from 'react';
import useAchievements from '../hooks/useAchievements';
import AchievementUnlocked from '../components/AchievementUnlocked';

/**
 * 🏆 ACHIEVEMENT PROVIDER - Contexto global para logros
 * 
 * Provee acceso global al sistema de logros
 */

const AchievementContext = createContext();

export const useGlobalAchievements = () => {
    const context = useContext(AchievementContext);
    if (!context) {
        throw new Error('useGlobalAchievements must be used within AchievementProvider');
    }
    return context;
};

export const AchievementProvider = ({ children }) => {
    const achievementSystem = useAchievements();

    return (
        <AchievementContext.Provider value={achievementSystem}>
            {children}

            {/* Show unlock animation when pending */}
            {achievementSystem.pendingUnlock && (
                <AchievementUnlocked
                    achievement={achievementSystem.pendingUnlock.achievement}
                    previousAchievement={achievementSystem.pendingUnlock.previousAchievement}
                    onClose={achievementSystem.clearPendingUnlock}
                />
            )}
        </AchievementContext.Provider>
    );
};
