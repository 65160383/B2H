// Suppress controller console.error/warn noise from intentional error-path tests
global.console.error = () => {};
global.console.warn  = () => {};
