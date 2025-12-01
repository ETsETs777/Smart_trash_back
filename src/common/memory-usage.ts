export const memoryUsageInMB = () => {
  const memoryUsage = process.memoryUsage();
  const total = Math.round(memoryUsage.rss / 1024 / 1024);
  const heap = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  return `MEM(Total: ${total} MB, Heap: ${heap} MB)`;
};
