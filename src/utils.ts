export const cssAnimationDurationAsNumber = (cssVar: string) =>
  +cssVar.replace("ms", "");
