export const isAdmin = true;

export const currentEmployeeId = "u1";

export const maintenanceTechnicians = [
  {
    id: "u1",
    name: "Nguyen Van Ky Thuat",
    role: "Ky thuat thang may",
  },
  {
    id: "u2",
    name: "Tran Thi An Toan",
    role: "Ky thuat PCCC",
  },
  {
    id: "u3",
    name: "Le Minh Co Dien",
    role: "Ky thuat co dien",
  },
];

export function getTechnicianName(employeeId?: string) {
  if (!employeeId) return undefined;
  return maintenanceTechnicians.find((technician) => technician.id === employeeId)?.name;
}
