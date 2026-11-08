/**
 * Estado de arranque de la app: hitos reales que la SplashScreen observa.
 * Los componentes llaman markBoot('map' | 'spots') cuando terminan su carga real.
 */
const done = new Set();
const listeners = new Set();

export const markBoot = (key) => {
    if (done.has(key)) return;
    done.add(key);
    listeners.forEach((fn) => fn(new Set(done)));
};

export const getBoot = () => new Set(done);

export const subscribeBoot = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};
