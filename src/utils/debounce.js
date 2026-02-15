export const debounce = (f, time) => {
  let timeoutId;

  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => f(...args), time);
  };
};
