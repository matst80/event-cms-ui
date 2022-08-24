import { h } from "jsx-real-dom/src/lib/createelement";
import {
  deleteEvent,
  fetchEvents,
  fetchProjection,
  listen,
  publishEvent,
  sendStateTransform,
} from "./utils";

function event(source) {
  return (event) => (
    <div>
      <pre>{JSON.stringify(event, null, 2)}</pre>
      <a onclick={() => deleteEvent(source, event)}>X</a>
    </div>
  );
}

function EventList({ source }) {
  const Event = event(source);
  const loadEvents = listen((cnt) => {
    fetchEvents(source).then(({ data }) => {
      cnt.replaceChildren(...data.map(Event));
    });
  });
  return (
    <div>
      <div ref={loadEvents}></div>
    </div>
  );
}

function ProjectionData({ source }) {
  const loadProjection = listen((cnt) => {
    fetchProjection(source).then((data) => {
      cnt.innerHTML = JSON.stringify(data, null, 2);
    });
  });
  return (
    <div>
      <pre ref={loadProjection}></pre>
    </div>
  );
}

function getFormData({ target }: SubmitEvent) {
  return target
    ? Array.from(target as HTMLFormElement).reduce(
        (data, elm: { id?: string; value?: string }) => {
          return elm.id && elm.value ? { ...data, [elm.id]: elm.value } : data;
        },
        {} as any
      )
    : {};
}

function js(data) {
  return JSON.stringify(data, null, 2);
}

const templateData = [
  { eventName: "update", data: js({ id: "a", name: "kalle" }) },
  { eventName: "birthday", data: js({ id: "a" }) },
  { eventName: "die", data: js({ id: "a" }) },
  { eventName: "linkImage", data: js({ id: "a", image: "slask.png" }) },
  {
    eventName: "create",
    data: js({ id: "e", name: "test", age: 0, shoeSize: 12 }),
  },
];

class Observable {
  #value: any[] = [];
  #chain: ((any) => any)[] = [];
  #subs: ((any) => void)[] = [];
  constructor(current?) {
    this.#handleValue(current);
  }
  push(data) {
    this.#handleValue(data);
    return this;
  }
  next(fn: (any) => any) {
    this.#chain.push(fn);
    return this;
  }
  sub(fn: (any) => void) {
    this.#subs.push(fn);
    return this;
  }
  #handleValue(data) {
    if (data) {
      let i = 0;
      const nxt = (current) => {
        if (i >= this.#chain.length) {
          this.#subs.forEach((fn) => fn(current));
          return;
        }
        const res = this.#chain[i++](current);
        if (res instanceof Promise) {
          res.then((asyncData) => {
            nxt(asyncData || current);
          });
        } else {
          nxt(res);
        }
      };
      nxt(data);
    }
  }
}

const fromEvent = (elm: HTMLElement, evt = "click") => {
  const obs = new Observable();
  elm.addEventListener(evt, (e) => {
    obs.push(e);
  });
  return obs;
};

const lnk = (obs: Observable) => (e: Event) => {
  obs.push(e);
  e.stopPropagation();
  e.preventDefault();
};

const getTemplateIndex = (e) => templateData[e.target.selectedIndex];

const setDataToInputs = (data: any) =>
  Object.entries(data).forEach(
    ([key, value]) => (document.getElementById(key)!.value = value)
  );

const sendEvent = new Observable().next(getFormData);

const sendTransform = new Observable().next(getFormData);

// const sendEventa = (e) => {
//   console.log("send event!!!");
//   e.stopPropagation();
//   e.preventDefault();
//   const { eventName, data } = getFormData(e.target);
//   publishEvent(source, eventName, JSON.parse(data));
//   return false;
// };

function App() {
  const source = location.hash ? location.hash.substring(1) : "jstest";
  sendEvent.sub(({ eventName, data }) =>
    publishEvent(source, eventName, JSON.parse(data))
  );
  sendTransform.sub(({ name, code }) => sendStateTransform(source, name, code));
  const templates = (select) => {
    fromEvent(select, "change").next(getTemplateIndex).sub(setDataToInputs);
    select.replaceChildren(
      ...templateData.map(({ eventName }) => <option>{eventName}</option>)
    );
  };

  return (
    <div>
      <header>
        <span>{source}</span>
      </header>
      <div class="flex">
        <div>
          <form onsubmit={lnk(sendEvent)}>
            <select ref={templates}></select>
            <input type="text" id="eventName" value="update"></input>
            <textarea id="data" value='{"id":"a","plupp":4}'></textarea>
            <button type="submit">Send</button>
          </form>
        </div>
        <div>
          <form onsubmit={lnk(sendTransform)}>
            <input type="text" id="name" value="test"></input>
            <textarea id="code" value="this.run = 1"></textarea>
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
      <div class="flex">
        <ProjectionData source={source} />

        <EventList source={source} />
      </div>
    </div>
  );
}

export default App;
