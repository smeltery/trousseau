/** Hash jump offset: taller when the sync banner sits under the fixed nav. */
export function sectionScrollMt(syncBanner: boolean): string {
  return syncBanner ? 'scroll-mt-40' : 'scroll-mt-24'
}
