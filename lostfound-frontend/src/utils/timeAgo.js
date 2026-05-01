export const timeAgo = (dateStr) => {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "Дөнгөж саяхан";
  if (mins  < 60)  return `${mins} минутын өмнө`;
  if (hours < 24)  return `${hours} цагийн өмнө`;
  if (days  < 7)   return `${days} хоногийн өмнө`;
  if (days  < 30)  return `${Math.floor(days / 7)} долоо хоногийн өмнө`;
  if (days  < 365) return `${Math.floor(days / 30)} сарын өмнө`;
  return `${Math.floor(days / 365)} жилийн өмнө`;
};
