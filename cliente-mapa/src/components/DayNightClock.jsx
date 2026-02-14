import React, { useState, useEffect } from 'react';
import './day-night-clock.css';

/**
 * 🌓 DAY/NIGHT CLOCK WIDGET
 * 
 * Muestra hora actual con ícono animado según el momento del día
 * - ☀️ Día (6am - 6pm)
 * - 🌙 Noche (6pm - 6am)
 * - 🌅 Amanecer (5am - 7am)
 * - 🌆 Atardecer (5pm - 7pm)
 */

const DayNightClock = ({ darkMode, onToggleDarkMode }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [is24Hour, setIs24Hour] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const getTimeOfDay = (hour) => {
        if (hour >= 5 && hour < 7) return 'sunrise';
        if (hour >= 7 && hour < 17) return 'day';
        if (hour >= 17 && hour < 19) return 'sunset';
        return 'night';
    };

    const getIcon = (timeOfDay) => {
        switch (timeOfDay) {
            case 'sunrise': return '🌅';
            case 'day': return '☀️';
            case 'sunset': return '🌆';
            case 'night': return '🌙';
            default: return '☀️';
        }
    };

    const getGreeting = (timeOfDay) => {
        switch (timeOfDay) {
            case 'sunrise': return 'Buenos días';
            case 'day': return 'Buenas tardes';
            case 'sunset': return 'Buen atardecer';
            case 'night': return 'Buenas noches';
            default: return 'Hola';
        }
    };

    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const timeOfDay = getTimeOfDay(hour);
    const icon = getIcon(timeOfDay);
    const greeting = getGreeting(timeOfDay);

    const formatTime = () => {
        if (is24Hour) {
            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        } else {
            const hour12 = hour % 12 || 12;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
        }
    };

    return (
        <div className={`day-night-clock ${timeOfDay}`}>
            <div className="clock-icon" onClick={onToggleDarkMode}>
                <span className="icon-emoji">{icon}</span>
            </div>

            <div className="clock-info">
                <div className="clock-time" onClick={() => setIs24Hour(!is24Hour)}>
                    {formatTime()}
                </div>
                <div className="clock-greeting">{greeting}</div>
            </div>

            {/* Decorative elements */}
            <div className="clock-glow"></div>
        </div>
    );
};

export default DayNightClock;
