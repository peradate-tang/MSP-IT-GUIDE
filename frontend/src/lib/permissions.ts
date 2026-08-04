// Permission helpers ที่ใช้ร่วมกันทั้งแอป — เพื่อไม่ให้ sidebar (nav) กับ route guard เช็คสิทธิ์ไม่ตรงกัน
// (บั๊กเดิม: sidebar เช็ครวม permission '*' แต่ route guard เช็คแค่ role.name === 'admin' ทำให้ "เห็นเมนูแต่กดไม่ได้")

interface UserLike {
  role?: { name?: string; permissions?: string[] } | null;
}

// สิทธิ์เฉพาะสำหรับเข้าหน้า Admin Panel (จัดการ users/roles/categories/report/บทความทั้งหมด)
// แยกจาก '*' (สิทธิ์ทั้งหมด) โดยตั้งใจ — จะได้ให้สิทธิ์เข้าหน้า admin กับบาง role ได้
// โดยไม่ต้องให้สิทธิ์ bypass ข้อจำกัดแผนกทั้งหมดผ่าน '*'
export const ADMIN_PANEL_PERMISSION = 'admin:access';

export function canAccessAdminPanel(user?: UserLike | null): boolean {
  if (!user?.role) return false;
  const { name, permissions } = user.role;
  if (name === 'admin') return true;
  if (permissions?.includes('*')) return true;
  if (permissions?.includes(ADMIN_PANEL_PERMISSION)) return true;
  return false;
}

export function isFullAdmin(user?: UserLike | null): boolean {
  if (!user?.role) return false;
  return user.role.name === 'admin' || !!user.role.permissions?.includes('*');
}

export function isEditorLike(user?: UserLike | null): boolean {
  if (isFullAdmin(user)) return true;
  const { name, permissions } = user?.role || {};
  return name === 'editor' || !!permissions?.includes('articles:write');
}
