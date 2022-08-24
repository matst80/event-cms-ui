const baseUrl = "http://localhost:3000/";

const pubsub = (listeners: ((data: any) => void)[] = []) => {
  return {
    pub: (data) => {
      listeners.forEach((fn) => {
        fn(data);
      });
    },
    sub: (fn) => {
      if (listeners.indexOf(fn) === -1) {
        console.trace("add", fn);
        listeners.push(fn);
      }
      return () => {
        listeners = listeners.filter((e) => e !== fn);
      };
    },
  };
};

const dataChanged = pubsub();

const triggerChange = (fn) => (data) => {
  fn(data);

  return data;
};

const eventsChanged = triggerChange(dataChanged.pub);

export const fetchEvents = (
  source: string
): Promise<{ end: number; data: any[] }> =>
  fetch(baseUrl + "replay/" + source).then((d) => d.json());

export const fetchProjection = (source: string): Promise<any> => {
  console.log("do fetch projection");
  return fetch(baseUrl + source).then((d) => d.json());
};

export const deleteEvent = (source: string, data: any) => {
  console.log(source, JSON.stringify(data));
  return fetch(baseUrl + "replay/" + source, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  }).then(eventsChanged);
};

export const publishEvent = (source: string, eventName: string, data: any) => {
  return fetch(baseUrl + source + "/" + eventName, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  }).then(eventsChanged);
};

export function listen(fn) {
  return (...args) => {
    fn(...args);
    dataChanged.sub((data) => fn(...args, data));
  };
}
