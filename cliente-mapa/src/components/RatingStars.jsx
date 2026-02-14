import React from 'react';

/**
 * ⭐ COMPONENTE DE ESTRELLAS
 * 
 * Muestra/selecciona rating de 1-5 estrellas
 */
const RatingStars = ({
    rating = 0,
    maxStars = 5,
    size = 24,
    interactive = false,
    onChange = () => { },
    darkMode = false
}) => {
    const handleClick = (starIndex) => {
        if (interactive) {
            onChange(starIndex + 1);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {[...Array(maxStars)].map((_, index) => {
                const filled = index < rating;
                return (
                    <span
                        key={index}
                        onClick={() => handleClick(index)}
                        style={{
                            fontSize: `${size}px`,
                            cursor: interactive ? 'pointer' : 'default',
                            color: filled ? '#FFD700' : (darkMode ? '#555' : '#ddd'),
                            transition: 'transform 0.1s, color 0.2s',
                            userSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (interactive) {
                                e.target.style.transform = 'scale(1.2)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                        }}
                    >
                        ★
                    </span>
                );
            })}
        </div>
    );
};

export default RatingStars;
