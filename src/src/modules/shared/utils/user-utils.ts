export const generateWalletAddress = () => {
  // Generate a random 40-character hexadecimal string
  const randomHex = Math.floor(Math.random() * 1e18)
    .toString(16)
    .padStart(40, '0');

  return `0x${randomHex}`;
};
