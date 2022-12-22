export function offsetToHourMinute(offset: number | string): [number, number] {
  if (typeof offset === "string") {
    offset = parseFloat(offset);
  }

  const [hour, minute] = offset
    .toFixed(2)
    .toString()
    .split(".")
    .map((x) => parseInt(x, 10));

  return [hour, minute];
}
