// mostly copy pasted from xstreams's "combine"'s tests
import xs, { Stream } from "xstream";
import { autorun } from "./autorun";
import { mockTimeSource } from "@cycle/time";

describe("autorun", () => {
  it("should combine AND-style two streams together", (done: any) => {
    const stream1 = xs.periodic(100).take(2);
    const stream2 = xs.periodic(120).take(2);
    const stream = autorun((v) => [v(stream1), v(stream2)]);
    let expected = [
      // [0, 0], // --> not possible beacause subscriptions are done sequentially, not
      [1, 0],
      [1, 1],
    ];
    let actual = [];
    stream.addListener({
      next: (x) => {
        actual.push(x);
      },
      error: done,
      complete: () => {
        expect(actual).toEqual(expected);
        done();
      },
    });
  });

  it("should have correct TypeScript signature", (done: any) => {
    const stream1 = xs.create<string>({
      start: (listener) => {},
      stop: () => {},
    });

    const stream2 = xs.create<string>({
      start: (listener) => {},
      stop: () => {},
    });

    const combined: Stream<[string, string]> = autorun((v) => [
      v(stream1),
      v(stream2),
    ]);
    done();
  });

  it("should complete only when all member streams have completed", (done: any) => {
    const stream1 = xs.periodic(30).take(1);
    const stream2 = xs.periodic(50).take(4);
    const stream = autorun((v) => [v(stream1), v(stream2)]).map((arr) =>
      arr.join("")
    );
    let expected = ["00", "01", "02", "03"];
    let actual = [];
    stream.addListener({
      next: (x) => {
        actual.push(x);
      },
      error: done,
      complete: () => {
        expect(actual).toEqual(expected);
        done();
      },
    });
  });

  it("should emit an empty array if combining zero streams", (done: any) => {
    const stream = autorun(() => []);
    const expected = [[]];
    let actual = [];
    stream.addListener({
      next: (a) => {
        actual.push(a);
      },
      error: done,
      complete: () => {
        expect(actual).toEqual(expected);
        done();
      },
    });
  });

  it("should just wrap the value if combining one stream", (done: any) => {
    const source = xs.periodic(100).take(3);
    const stream = autorun((v) => [v(source)]);
    let expected = [[0], [1], [2]];
    let actual = [];

    stream.addListener({
      next: (x) => {
        actual.push(x);
      },
      error: done,
      complete: () => {
        expect(actual).toEqual(expected);
        done();
      },
    });
  });

  it("should not break future listeners when CombineProducer tears down", (done: any) => {
    //     --0--1-2--|  innerA
    //     ---0---1--|  innerB
    // ----0----1-2--|  outer
    const innerA = xs.create<number>();
    const innerB = xs.create<number>();
    const outer = xs.create<number>();
    const arrayInners: Array<Stream<number>> = [];
    const stream = outer
      .map((x) => {
        return autorun((v) => arrayInners.map(v)).map(
          (combination) => `${x}${combination.join("")}`
        );
      })
      .flatten();
    const expected = ["00"];
    let actual = [];

    setTimeout(() => {
      arrayInners.push(innerA);
      outer.shamefullySendNext(0);
    }, 100);
    setTimeout(() => {
      innerA.shamefullySendNext(0);
    }, 150);
    setTimeout(() => {
      innerB.shamefullySendNext(0);
    }, 175);
    setTimeout(() => {
      arrayInners.push(innerB);
      outer.shamefullySendNext(1);
      innerA.shamefullySendNext(1);
    }, 200);
    setTimeout(() => {
      innerA.shamefullySendNext(2);
      outer.shamefullySendNext(2);
      innerB.shamefullySendNext(1);
    }, 250);
    setTimeout(() => {
      innerA.shamefullySendComplete();
      innerB.shamefullySendComplete();
      outer.shamefullySendComplete();
    }, 550);

    stream.addListener({
      next: (x: string) => {
        actual.push(x);
      },
      error: (err: any) => done(err),
      complete: () => {
        expect(actual).toEqual(expected);
        done();
      },
    });
  });

  it("should return a Stream when combining a MemoryStream with a Stream", (done: any) => {
    const input1 = xs.periodic(50).take(4).remember();
    const input2 = xs.periodic(80).take(3);
    const stream: Stream<[number, number]> = autorun((v) => [
      v(input1),
      v(input2),
    ]);
    expect(stream instanceof Stream).toEqual(true);
    done();
  });

  it("should return a Stream when combining a MemoryStream with a MemoryStream", (done: any) => {
    const input1 = xs.periodic(50).take(4).remember();
    const input2 = xs.periodic(80).take(3).remember();
    const stream: Stream<[number, number]> = autorun((v) => [
      v(input1),
      v(input2),
    ]);
    expect(stream instanceof Stream).toEqual(true);
    done();
  });

  it("tracks subscriptions dynamically", (done: any) => {
    const Time = mockTimeSource();
    const a$ = xs.of("a");
    const b$ = xs.of("b");
    const condition$ = Time.diagram("--0--1");

    Time.assertEqual(
      autorun((v) => {
        if (!v(condition$)) {
          return v(a$);
        }

        return v(b$);
      }),
      xs.combine(condition$, a$, b$).map(([condition, a, b]) => {
        if (!condition) {
          return a;
        }

        return b;
      })
    );

    Time.run(done);
  });
});
