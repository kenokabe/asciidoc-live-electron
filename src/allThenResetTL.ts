import { T } from
  "./timeline-monad";

interface timeline {
  type: string;
  now: any;
  sync: Function;
}

const allThenResetTL = (TLs: timeline[]) => T(
  (self: timeline) => {
    const updateFlagsTL = T(
      (self: timeline) =>
        self.now = Array(TLs.length).fill(0)
    );
    const resetFlag = () => {
      updateFlagsTL.now = Array(TLs.length).fill(0)
      return true;
    };
    const replace = (arr: number[]) => (index: number) =>
      (val: number) =>
        [...arr.slice(0, index), val,
        ...arr.slice(index + 1)];

    const updateFlag = TLs
      .map((TL, index) =>
        TL.sync(() => (updateFlagsTL.now =
          replace(updateFlagsTL.now as number[])(index)(1))));
    const allUpdatedCheck = updateFlagsTL.sync(
      (updateFlags: number[]) =>
        (updateFlags         //all  updated
          .reduce((a: number, b: number) => (a * b)) === 1)
          ? resetFlag() &&
          (self.now = TLs.map((TL) => TL.now))
          : true
    );
  }
);

export { allThenResetTL };