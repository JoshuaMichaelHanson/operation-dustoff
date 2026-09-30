export interface DisplaySize {
  width: number;
  height: number;
}

export function calculateContainedDisplaySize(
  availableWidth: number,
  availableHeight: number,
  nativeWidth: number,
  nativeHeight: number,
): DisplaySize {
  if (
    availableWidth <= 0 ||
    availableHeight <= 0 ||
    nativeWidth <= 0 ||
    nativeHeight <= 0
  ) {
    return { width: 0, height: 0 };
  }

  const scale = Math.min(
    1,
    availableWidth / nativeWidth,
    availableHeight / nativeHeight,
  );

  return {
    width: Math.floor(nativeWidth * scale),
    height: Math.floor(nativeHeight * scale),
  };
}
