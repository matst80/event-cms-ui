import { h } from "jsx-real-dom/src/lib/createelement";
import {
  delay,
  empty,
  forkJoin,
  fromEvent,
  lnk,
  map,
  of,
  tap,
} from "jsx-real-dom/src/lib/utils/observable";
import {
  dataChanged,
  deleteEventCommand,
  EventType,
  fetchEvents,
  fetchProjection,
  publishEvent,
  sendStateTransform,
} from "./utils";

const sourceEvent = fromEvent(window, "hashchange", location.hash, (e) =>
  e ? e.substring(1) : "jstest"
);

const lastChangeEvent = of(Date.now());
const changeEvent = forkJoin({
  source: sourceEvent,
  lastChange: lastChangeEvent,
}).pipe(delay(20));

const triggerChange = (_: any) => lastChangeEvent.emit(Date.now());
dataChanged.sub(triggerChange);
lastChangeEvent.subscribe((d) => console.log());
const sendEvent = empty<SubmitEvent>();
const sendTransform = empty<SubmitEvent>();
const templateChange = empty<Event>();
const selectedEvent = empty<EventType>();
forkJoin({
  source: sourceEvent,
  event: selectedEvent,
}).pipe(map(deleteEventCommand), tap(triggerChange));

function Event(event: any) {
  return (
    <div>
      <pre>{JSON.stringify(event, null, 2)}</pre>
      <a onclick={() => selectedEvent.emit(event)}>X</a>
    </div>
  );
}

function EventList() {
  const loadEvents = (cnt) =>
    changeEvent.next(map(fetchEvents)).subscribe(({ data }) => {
      data.reverse();
      cnt.replaceChildren(...data.map(Event));
    });

  return (
    <div>
      <div ref={loadEvents}></div>
    </div>
  );
}

function ProjectionData() {
  const loadProjection = (cnt) => {
    changeEvent.next(map(fetchProjection)).subscribe((d) => {
      cnt.innerHTML = JSON.stringify(d, null, 2);
    });
  };

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

function App() {
  const source = location.hash ? location.hash.substring(1) : "jstest";
  sendEvent.pipe(map(getFormData)).subscribe(publishEvent(source));
  sendTransform.pipe(map(getFormData)).subscribe(sendStateTransform(source));
  templateChange.pipe(map(getTemplateIndex)).subscribe(setDataToInputs);

  return (
    <div>
      <header>
        <span>{source}</span>
      </header>
      <div class="flex">
        <div>
          <form onsubmit={lnk(sendEvent)}>
            <select onchange={lnk(templateChange)}>
              {...templateData.map(({ eventName }) => (
                <option>{eventName}</option>
              ))}
            </select>
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
        <ProjectionData />

        <EventList />
      </div>
    </div>
  );
}

export default App;
