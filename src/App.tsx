import { h } from "jsx-real-dom/src/lib/createelement";
import { conditionalMerge } from "jsx-real-dom/src/lib/utils/mergeChildren";
import { debounce, link, makeObservable } from "jsx-real-dom/src/lib/utils/obs";
import {
  dataChanged,
  deleteEventCommand,
  fetchEvents,
  fetchProjection,
  publishEvent,
  sendStateTransform,
} from "./utils";

type StateType = {
  source: string;
  lastChange: number;
};

const getSource = () => (location.hash ? location.hash.substring(1) : "jstest");
const [state, stateChanged] = makeObservable<StateType>({
  source: getSource(),
  lastChange: Date.now(),
});

addEventListener("hashchange", () => {
  state.source = getSource();
});

dataChanged.sub(
  debounce(() => {
    state.lastChange = Date.now();
  }, 20)
);

function Event({ key, ...event }: any) {
  return (
    <div data-key={key}>
      <pre>{JSON.stringify(event, null, 2)}</pre>
      <a onclick={() => deleteEventCommand({ ...state, event })}>X</a>
    </div>
  );
}

const getEventKey = (event: any, i: number) => {
  return `${event.eventName}-${i}`;
};

function EventList() {
  const loadEvents = (data, cnt) =>
    fetchEvents(data).then(({ data }) => {
      const nodes = data.map((e, i) => ({ ...e, key: getEventKey(e, i) }));
      conditionalMerge(Event, nodes, cnt, (el) => el.dataset.key);
    });

  return (
    <div>
      <div ref={link(stateChanged, loadEvents)} class="rev"></div>
    </div>
  );
}

function ProjectionData() {
  const loadProjection = (data: { source: string }, cnt: HTMLElement) => {
    fetchProjection(data).then((d) => {
      cnt.innerHTML = JSON.stringify(d, null, 2);
    });

    // changeEvent.next(map(fetchProjection)).subscribe((d) => {
    //   cnt.innerHTML = JSON.stringify(d, null, 2);
    // });
  };

  return (
    <div>
      <pre ref={link(stateChanged, loadProjection)}></pre>
    </div>
  );
}

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
  const sendEvent = (e) => publishEvent(getFormData(e), state.source);
  const sendTemplate = (e) => sendStateTransform(getFormData(e), state.source);
  const templateChange = (e) => setDataToInputs(getTemplateIndex(e));

  return (
    <div>
      <div class="flex">
        <div>
          <form onsubmit={sendEvent}>
            <select onchange={templateChange}>
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
          <form onsubmit={sendTemplate}>
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
