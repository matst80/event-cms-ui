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
        listeners.push(fn);
      }
      return () => {
        listeners = listeners.filter((e) => e !== fn);
      };
    },
  };
};

const dataChanged = pubsub();

// const delay =
//   (time = 200) =>
//   () =>
//     new Promise((res) => setTimeout(res, time));

// const debounce = (time=200) => {
//   let timer =
//   return ()=>{}
// }

const triggerChange = (fn) => (data) => {
  fn(data);

  return data;
};

export const eventsChanged = triggerChange(dataChanged.pub);

export const fetchEvents = (
  source: string
): Promise<{ end: number; data: any[] }> =>
  fetch(baseUrl + "replay/" + source).then((d) => d.json());

export const fetchProjection = (source: string): Promise<any> => {
  console.log("do fetch projection", source);
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

export const sendStateTransform =
  (source: string) =>
  ({ name, code }: { name: string; code: string }) => {
    return fetch(`${baseUrl}transform/${source}/${name}`, {
      method: "PUT",
      body: code,
    }).then(eventsChanged);
  };

export function listen(fn) {
  return (...args) => {
    fn(...args);
    dataChanged.sub((data) => fn(...args, data));
  };
}
