const colors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  GATHERING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NEW: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  ENROLLED: 'bg-green-100 text-green-700',
  NOT_COME: 'bg-gray-100 text-gray-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-red-100 text-red-700',
  DEMO: 'bg-purple-100 text-purple-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  ADVANCE: 'bg-blue-100 text-blue-700',
  MONTHLY: 'bg-indigo-100 text-indigo-700',
  CASH: 'bg-green-100 text-green-700',
  PAYME: 'bg-cyan-100 text-cyan-700',
  CLICK: 'bg-orange-100 text-orange-700',
  BANK_TRANSFER: 'bg-purple-100 text-purple-700',
  ONLINE: 'bg-blue-100 text-blue-700',
  OFFLINE: 'bg-amber-100 text-amber-700',
  SUPERADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-indigo-100 text-indigo-700',
  OPERATOR: 'bg-teal-100 text-teal-700',
};

const labels: Record<string, string> = {
  ACTIVE: 'Faol',
  GATHERING: "To'plash",
  COMPLETED: 'Yakunlangan',
  CANCELLED: 'Bekor',
  NEW: 'Yangi',
  IN_PROGRESS: 'Muloqotda',
  ENROLLED: 'Yozildi',
  NOT_COME: 'Kelmadi',
  REJECTED: 'Rad etdi',
  EXPIRED: 'Tugagan',
  DEMO: 'Demo',
  SUSPENDED: "To'xtatilgan",
  ADVANCE: 'Avans',
  MONTHLY: 'Oylik',
  CASH: 'Naqd',
  PAYME: 'Payme',
  CLICK: 'Click',
  BANK_TRANSFER: "Bank o'tkazmasi",
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  OPERATOR: 'Operator',
};

export default function Badge({ value }: { value: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[value] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[value] ?? value}
    </span>
  );
}
