import { T } from
  "./timeline-monad.js";

interface timeline {
  type: string;
  now: any;
  sync: Function;
}

const right = (a: any) => (b: any) => b;

const replace = (arr: number[]) =>
  (index: number) =>
    (val: number) =>
      [...arr.slice(0, index), val,
      ...arr.slice(index + 1)];

const updateFlagsTL = (TLs: timeline[]) =>
  (selfAll: timeline) =>
    T((self: timeline) => {
      self.now = Array(TLs.length).fill(0);

      TLs
        .map((TL, index1) =>
          TL.sync(
            () => right

              (TLs.map((tl, index0) =>
                (tl.now === undefined)
                  ? self.now = replace(self.now)(index0)(0)
                  : undefined))

              (self.now = replace(self.now)(index1)(1))
          )
        );

      self.sync(
        (updateFlags: number[]) =>
          selfAll.now =
          (updateFlags //all  updated--------
            .reduce((a: number, b: number) =>
              (a * b)) !== 1)
            ? undefined//no trigger
            : right
              (self.now = Array(TLs.length).fill(0))
              (TLs.map((TL) => TL.now))
      );
    });

const allThenResetTL =
  (TLs: timeline[]) =>
    T((selfAll: timeline) =>
      updateFlagsTL(TLs)(selfAll)
    );

export { allThenResetTL };
