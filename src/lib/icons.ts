// Item icons on pages are WebP: several times smaller than the PNG files next to them.
// The PNG files stay for the link preview images (og.png), which cannot read WebP.
export function iconSrc(id: string): string {
  return `/icons/${id}.webp`;
}
