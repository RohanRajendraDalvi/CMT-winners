

export const reportSlip = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 700);
  });
};

export const detectNearbySlips = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const randomCount = Math.floor(Math.random() * 4); // 0–3 nearby slips
      resolve(randomCount);
    }, 900);
  });
};
