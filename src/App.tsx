import { h } from "jsx-real-dom/src/lib/createelement";
import {
  fromEvent,
  lnk,
  map,
  Observable,
} from "jsx-real-dom/src/lib/utils/observable";
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
  const base: { [key: string]: string } = {};
  return target
    ? Array.from(target as HTMLFormElement).reduce(
        (data, elm: { id?: string; value?: string }) => {
          return elm.id && elm.value ? { ...data, [elm.id]: elm.value } : data;
        },
        base
      )
    : base;
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

const getTemplateIndex = (e) => templateData[e.target.selectedIndex];

const asInput = (id) =>
  document.getElementById(id) as (HTMLElement & { value?: string }) | null;

const setDataToInputs = (data: { [key: string]: string }) =>
  Object.entries(data).forEach(([key, value]) => (asInput(key)!.value = value));

const sendEvent = new Observable<SubmitEvent, SubmitEvent>();

const sendTransform = new Observable<SubmitEvent, SubmitEvent>();

function App() {
  const source = location.hash ? location.hash.substring(1) : "jstest";
  sendEvent.pipe(map(getFormData)).subscribe(publishEvent(source));
  sendTransform.pipe(map(getFormData)).subscribe(sendStateTransform(source));
  sendEvent.subscribe(console.log);
  const templates = (select) => {
    fromEvent(select, "change")
      .pipe(map(getTemplateIndex))
      .subscribe(setDataToInputs);
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
