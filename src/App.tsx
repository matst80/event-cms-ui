import { h } from "jsx-real-dom/src/lib/createelement";
import {
  push,
  delay,
  empty,
  forkJoin,
  fromEvent,
  lnk,
  map,
  of,
} from "jsx-real-dom/src/lib/utils/observable";
import {
  dataChanged,
  deleteEventCommand,
  EventType,
  fetchEvents,
  fetchProjection,
  publishEvent,
  PublishType,
  sendStateTransform,
} from "./utils";

const getSource = () => (location.hash ? location.hash.substring(1) : "jstest");
const sourceEvent = of(getSource());

addEventListener("hashchange", (e) => {
  sourceEvent.emit(getSource());
});

const lastChangeEvent = of(Date.now());
const changeEvent = forkJoin({
  source: sourceEvent,
  lastChange: lastChangeEvent,
}).next<any>(delay(20));

const triggerChange = () => lastChangeEvent.emit(Date.now());
dataChanged.sub(triggerChange);

const sendEvent = empty<SubmitEvent>();
const sendTransform = empty<SubmitEvent>();
const templateChange = empty<Event>();
const selectedEvent = empty<EventType>();
forkJoin({
  source: sourceEvent,
  event: selectedEvent,
})
  .next(map(deleteEventCommand))
  .subscribe(triggerChange);

sourceEvent.next(push(lastChangeEvent)).subscribe(console.log);

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

const scrollEvent = fromEvent(window, "scroll")
  .next(delay<Event>(200))
  .subscribe(console.log);

function getFormData<T extends { [key: string]: string }>({
  target,
}: SubmitEvent) {
  return target
    ? Array.from(target as HTMLFormElement).reduce(
        (data, elm: { id?: string; value?: string }) => {
          return elm.id && elm.value ? { ...data, [elm.id]: elm.value } : data;
        },
        {} as T
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

const getTemplateIndex = (e) => templateData[e.target.selectedIndex];

const asInput = (id) =>
  document.getElementById(id) as (HTMLElement & { value?: string }) | null;

const setDataToInputs = (data: { [key: string]: string }) =>
  Object.entries(data).forEach(([key, value]) => (asInput(key)!.value = value));

function App() {
  // const source = location.hash ? location.hash.substring(1) : "jstest";
  sendEvent
    .next(map(getFormData))
    .next(push(sourceEvent))
    .subscribe(publishEvent);
  sendTransform
    .next(map(getFormData))
    .next(push(sourceEvent))
    .subscribe(sendStateTransform);
  templateChange.next(map(getTemplateIndex)).subscribe(setDataToInputs);

  return (
    <div>
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
