import dropRepeats from "xstream/extra/dropRepeats";
import { mockTimeSource, MockTimeSource } from "@cycle/time";
import { h } from "@cycle/dom";
import { createElement, trackChildren } from "./index";
import xs, { Stream } from "xstream";
import toHTML from "snabbdom-to-html";
import prettify from "html-prettify";
import { onUnmount } from "../context/unmount";

console.log({ createElement });

function assertDomEqual(
  Time: MockTimeSource,
  actual$: Stream<any>,
  expected$: Stream<any>
) {
  Time.assertEqual(
    actual$.map(toHTML).map(prettify),
    expected$.map(toHTML).map(prettify)
  );
}

test("pragma works like h() for simple tags", (done) => {
  const Time = mockTimeSource();

  assertDomEqual(Time, xs.of(<div>coucou</div>), xs.of(h("div", ["coucou"])));
  assertDomEqual(
    Time,
    xs.of(<input type="text" value="coucou" />),
    xs.of(h("input", { type: "text", value: "coucou" }, []))
  );

  Time.run(done);
});

test("pragma unwraps child streams", (done) => {
  const Time = mockTimeSource();

  const childA$ = Time.diagram("a--A--a");
  const childB$ = Time.diagram("b-B----");
  assertDomEqual(
    Time,
    <div>
      {childA$}
      <h1>{childB$}</h1>
    </div>,
    xs
      .combine(childA$, childB$)
      .map(([childA, childB]) => h("div", [childA, h("h1", childB)]))
  );

  Time.run(done);
});

test("pragma unwraps arbitrary nested child streams", (done) => {
  const Time = mockTimeSource();

  const childA$ = Time.diagram("a--A--a").map(xs.of).map(xs.of);
  assertDomEqual(
    Time,
    <div>{childA$}</div>,
    childA$
      .flatten()
      .flatten()
      .map((childA) => h("div", [childA]))
  );

  Time.run(done);
});

test("pragma unwraps props", (done) => {
  const Time = mockTimeSource();

  const value$ = Time.diagram("a--A--a").map(xs.of).map(xs.of);
  assertDomEqual(
    Time,
    <input type="text" value={value$} />,
    value$.map((value) => h("input", { type: "text", value }, []))
  );

  Time.run(done);
});

// test("pragma handles simple components", (done) => {
//   const Time = mockTimeSource();

//   function Component() {
//     return xs.of(<div>Hello</div>);
//   }

//   assertDomEqual(Time, <Component />, Component());

//   Time.run(done);
// });

test("keeps dynamic components alive until unmount", (done) => {
  const Time = mockTimeSource();

  function ComponentA() {
    const rerender$ = Time.diagram("1-1---1--");
    return rerender$.map(() => <ComponentB />);
  }

  function ComponentB() {
    const timer$ = Time.diagram("1---2---3");
    return timer$;
  }

  const rerender$ = Time.diagram("1-1---1--");
  const timer$ = Time.diagram("1---2---3");

  Time.assertEqual(trackChildren(<ComponentA />), Time.diagram("1-1-2-2-3"));

  Time.run(done);
});

test("stop receiving DOM updates on remove", (done) => {
  const Time = mockTimeSource();

  function ComponentA() {
    const visible$ = Time.diagram("1--0-");
    return visible$.map((visible) => (visible ? <ComponentB /> : "x"));
  }

  function ComponentB() {
    const timer$ = Time.diagram("123456789");
    return timer$;
  }

  Time.assertEqual(trackChildren(<ComponentA />), Time.diagram("123x"));

  Time.run(done);
});

test("start receiving DOM updates on insert", (done) => {
  const Time = mockTimeSource();

  function ComponentA() {
    const visible$ = Time.diagram("0--1-");
    return visible$.map((visible) => (visible ? <ComponentB /> : "x"));
  }

  function ComponentB() {
    const timer$ = Time.diagram("123456");
    return timer$;
  }

  Time.assertEqual(
    trackChildren(<ComponentA />),
    Time.diagram("0--1-")
      .map((visible) => (visible ? ComponentB() : xs.of("x")))
      .flatten()
  );

  Time.run(done);
});

test("call unmount on remove", (done) => {
  const Time = mockTimeSource();

  let AmountedTimes = 0;
  let AunmountedTimes = 0;
  function ComponentA() {
    const visible$ = Time.diagram("1110-");

    AmountedTimes++;
    onUnmount(() => {
      AunmountedTimes++;
    });

    return visible$.map((visible) => (visible ? <ComponentB /> : "x"));
  }

  let BmountedTimes = 0;
  let BunmountedTimes = 0;
  function ComponentB() {
    const timer$ = Time.diagram("123456789");

    BmountedTimes++;
    onUnmount(() => {
      BunmountedTimes++;
    });
    return timer$;
  }

  // Time.assertEqual(trackChildren(<ComponentA />), Time.diagram("123x"));
  Time.assertEqual(
    trackChildren(
      Time.diagram("110-").map((visible) => (visible ? <ComponentA /> : ""))
    ),
    Time.diagram("1x")
  );

  Time.run(() => {
    expect(AmountedTimes).toEqual(1);
    expect(AunmountedTimes).toEqual(1);

    expect(BmountedTimes).toEqual(1);
    expect(BunmountedTimes).toEqual(1);

    done();
  });
});

test("don't call unmount on update", (done) => {
  const Time = mockTimeSource();

  function ComponentA() {
    const visible$ = Time.diagram("1111");
    return visible$.map((visible) => (visible ? <ComponentB /> : "x"));
  }

  let unmounted = 0;
  function ComponentB() {
    const timer$ = Time.diagram("123456789");

    onUnmount(() => {
      unmounted++;
    });
    return timer$;
  }

  Time.assertEqual(trackChildren(<ComponentA />), ComponentB());

  Time.run(() => {
    expect(unmounted).toEqual(0);
    done();
  });
});
