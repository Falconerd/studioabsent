import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Calendar } from "../components/Calendar";
import { GoChevronLeft } from "react-icons/go";
import styles from "./bookings.module.css";
import artists from "../artists.json";
import dayjs from "dayjs";
import { Slot } from "../components/Slot";
import { SpinnerCircular } from "spinners-react";

type TimeSlot = {
  hour: number;
  minute: number;
  duration: number;
};

type Times = {
  su?: TimeSlot[];
  mo?: TimeSlot[];
  tu?: TimeSlot[];
  we?: TimeSlot[];
  th?: TimeSlot[];
  fr?: TimeSlot[];
  sa?: TimeSlot[];
};

type Artist = {
  name: string;
  calendarId: string;
  availableTimes: Times;
};

type Slot = {
  year: number /* 4 numbers, eg: 2021 */;
  month: number /* 0-11 */;
  date: number /* 1-31 */;
  hour: number /* 0-23 */;
  minute: number /* 0-59 */;
};

type FormItemProps = {
  name: string;
  labelText: string;
  description?: string;
  children: JSX.Element;
};

const FormItem = ({
  name,
  labelText,
  description,
  children,
}: FormItemProps) => (
  <div className={styles.FormItem}>
    <label htmlFor={name}>{labelText}</label>
    {description && (
      <div className={styles.FormItem_Description}>{description}</div>
    )}
    {children}
  </div>
);

type BookingsState = {
  artist?: Artist;
  selectedSlot?: Slot;
  hasAgreed: boolean;
  requiredFieldsFilled: boolean;
  year: number;
  month: number;
  day: number;
  availableTimes: Times | never[];
  monthOffset: number;
  isLoading: boolean;
  isSaving: boolean;
};

enum BookingsActionKind {
  AGREE_TOGGLED = "AGREE_TOGGLED",
  MONTH_CHANGED = "MONTH_CHANGED",
  ARTIST_SELECTED = "ARTIST_SELECTED",
  FETCH_TIMES_SUCCESS = "FETCH_TIMES_SUCCESS",
  FETCH_TIMES_FAILURE = "FETCH_TIMES_FAILURE",
  FETCH_TIMES_REQUEST = "FETCH_TIMES_REQUEST",
  SUBMIT_SUCCESS = "SUBMIT_SUCCESS",
  SUBMIT_FAILURE = "SUBMIT_FAILURE",
  SUBMIT_REQUEST = "SUBMIT_REQUEST",
  SLOT_SELECTED = "SLOT_SELECTED",
  FORM_VALUE_CHANGED = "FORM_VALUE_CHANGED",
}

type BookingsAction = {
  type: BookingsActionKind;
  payload?: any;
};

const reducer = (state: BookingsState, action: BookingsAction) => {
  const { type, payload } = action;

  switch (type) {
    case BookingsActionKind.AGREE_TOGGLED: {
      return { ...state, hasAgreed: !state.hasAgreed };
    }

    case BookingsActionKind.MONTH_CHANGED: {
      const { month, lastMonth } = payload;
      let year = state.year;

      let monthOffset =
        month > lastMonth ? state.monthOffset + 1 : state.monthOffset - 1;

      if (month === 0 && lastMonth === 11) {
        --year;
        monthOffset = state.monthOffset + 1;
      }

      if (month === 11 && lastMonth === 0) {
        ++year;
        monthOffset = state.monthOffset - 1;
      }

      return { ...state, month, year, monthOffset };
    }

    case BookingsActionKind.ARTIST_SELECTED: {
      const artist = artists.find((item) => item.name === payload);
      return { ...state, artist };
    }

    case BookingsActionKind.FETCH_TIMES_SUCCESS: {
      return { ...state, availableTimes: payload, isLoading: false };
    }

    case BookingsActionKind.FETCH_TIMES_FAILURE: {
      return { ...state, availableTimes: [], isLoading: false };
    }

    case BookingsActionKind.FETCH_TIMES_REQUEST: {
      return { ...state, availableTimes: [], isLoading: true };
    }

    case BookingsActionKind.SLOT_SELECTED: {
      const { year, month, date, hour, minute } = payload;
      return { ...state, selectedSlot: { year, month, date, hour, minute } };
    }

    case BookingsActionKind.FORM_VALUE_CHANGED: {
      const form = payload.target.form;
      const formElements = form.elements as typeof form.elements & {
        first_name: { value: string };
        last_name: { value: string };
        email: { value: string };
        description: { value: string };
        sizing: { value: string };
        placement: { value: string };
        references: { files: File[] };
      };
      let filled = true;
      if (!formElements.first_name.value) filled = false;
      if (!formElements.last_name.value) filled = false;
      if (!formElements.email.value) filled = false;
      if (!formElements.description.value) filled = false;
      if (!formElements.sizing.value) filled = false;
      if (!formElements.placement.value) filled = false;
      if (
        !formElements.references.files ||
        !formElements.references.files.length
      )
        filled = false;
      return { ...state, requiredFieldsFilled: filled };
    }

    case BookingsActionKind.SUBMIT_REQUEST: {
      return { ...state, isSaving: true };
    }

    case BookingsActionKind.SUBMIT_SUCCESS: {
      return { ...state, isSaving: false };
    }

    case BookingsActionKind.SUBMIT_FAILURE: {
      return { ...state, isSaving: false };
    }
  }
};

const initialState: BookingsState = {
  hasAgreed: false,
  requiredFieldsFilled: false,
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  day: new Date().getDate(),
  availableTimes: [],
  monthOffset: 0,
  isLoading: false,
  isSaving: false,
};

function availableTimesToSearchParamsString(times: Times): string {
  let str = "";

  for (const [key, value] of Object.entries(times)) {
    for (const time of value) {
      str += `&${key}=${time.hour}:${time.minute}:${time.duration}`;
    }
  }

  return str;
}

async function changeArtist(e: any, state: BookingsState, dispatch: any) {
  dispatch({
    type: BookingsActionKind.ARTIST_SELECTED,
    payload: e.target.value,
  });

  const artist = artists.find(({name}) => name === e.target.value);

  if (!artist) {
    return;
  }

  try {
    const calendarId = artist.calendarId;
    const timeMin = dayjs().toISOString();
    const timeMax = dayjs()
      .startOf("month")
      .add(6, "month")
      .endOf("month")
      .toISOString();
    const availableTimes = availableTimesToSearchParamsString(
      artist.availableTimes
    );

    dispatch({ type: BookingsActionKind.FETCH_TIMES_REQUEST });
    const res = await fetch(
      `/api/?calendarId=${calendarId}&timeMin=${timeMin}&timeMax=${timeMax}${availableTimes}`
    );
    const { availableEvents } = await res.json();

    // TODO: what's the point of try catch if 500 doesn't throw??
    if (!availableEvents) {
      throw new Error("Failed to retrieve events.");
    }

    dispatch({
      type: BookingsActionKind.FETCH_TIMES_SUCCESS,
      payload: availableEvents,
    });
  } catch (e: any) {
    dispatch({ type: BookingsActionKind.FETCH_TIMES_FAILURE });
    console.error(e.message);
  }
}

const BookingsPage = () => {
  const isInitialLoad = React.useRef(true);
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const router = useRouter();

  React.useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      changeArtist({target: {value: artists[0].name}}, state, dispatch);
    }
  }, [state]);

  const onChangeMonth = (month: number, lastMonth: number) => {
    dispatch({
      type: BookingsActionKind.MONTH_CHANGED,
      payload: { month, lastMonth },
    });
  };

  const onSelectSlot = (
    year: number,
    month: number,
    date: number,
    hour: number,
    minute: number
  ) => {
    dispatch({
      type: BookingsActionKind.SLOT_SELECTED,
      payload: { year, month, date, hour, minute },
    });
  };

  const onSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!state.selectedSlot) {
      console.log("Nah bra");
      return;
    }

    dispatch({ type: BookingsActionKind.SUBMIT_REQUEST });

    const form = e.currentTarget;
    const formElements = form.elements as typeof form.elements & {
      first_name: { value: string };
      last_name: { value: string };
      email: { value: string };
      phone: { value: string };
      description: { value: string };
      sizing: { value: string };
      placement: { value: string };
      references: { files: File[] };
    };

    const formData = new FormData();

    formData.append("first_name", formElements.first_name.value);
    formData.append("last_name", formElements.last_name.value);
    formData.append("email", formElements.email.value);

    if (formElements.phone.value) {
      formData.append("phone", formElements.phone.value);
    }

    formData.append("description", formElements.description.value);
    formData.append("sizing", formElements.sizing.value);
    formData.append("placement", formElements.placement.value);

    for (let i = 0; i < formElements.references.files.length; ++i) {
      formData.append(
        "references",
        formElements.references.files[i],
        formElements.references.files[i].name
      );
    }

    const { year, month, date, hour, minute } = state.selectedSlot;
    const dateString = dayjs(
      `${year}-${month + 1}-${date} ${hour}:${minute}`
    ).format();

    formData.append("date", dateString);

    if (!state.artist?.calendarId) {
      console.log("No artist selected, somehow.");
      return;
    }

    formData.append("calendarId", state.artist.calendarId);

    (async () => {
      if (formElements.references.files.length === 0) return;

      try {
        const res = await fetch(`/api/`, {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          redirect: "follow",
          referrerPolicy: "no-referrer",
          body: formData,
        });
        console.log({res});
        dispatch({ type: BookingsActionKind.SUBMIT_SUCCESS });
        router.push("/thankyou");
      } catch (e) {
        dispatch({ type: BookingsActionKind.SUBMIT_FAILURE });
        console.error(e);
      }
    })();

    return false;
  };

  const onFormChange = (e: any) => {
    dispatch({ type: BookingsActionKind.FORM_VALUE_CHANGED, payload: e });
  };

  const submitEnabled =
    state.selectedSlot && state.hasAgreed && state.requiredFieldsFilled;

  return (
    <>
      <Link href="/" passHref>
        <button className={styles.BackButton}>
          <GoChevronLeft />
        </button>
      </Link>
      <h1>Bookings</h1>
      <form className={styles.Form} onSubmit={onSubmit} onChange={onFormChange}>
        <FormItem name="artist" labelText="Artist*">
          <select onChange={(e: any) => changeArtist(e, state, dispatch)}>
            {artists.map(({name}) => <option key={name} value={name}>{name}</option>)}
          </select>
        </FormItem>
        <Calendar
          availabilities={state.availableTimes[state.monthOffset]}
          maxOffset={5}
          onChangeMonth={onChangeMonth}
          onSelectSlot={onSelectSlot}
          isLoading={state.isLoading}
        />
        <h2>Details</h2>
        <FormItem name="first_name" labelText="First name*">
          <input id="first_name" required />
        </FormItem>
        <FormItem name="last_name" labelText="Last name*">
          <input id="last_name" required />
        </FormItem>
        <FormItem name="email" labelText="Email*">
          <input id="email" required />
        </FormItem>
        <FormItem name="phone" labelText="Phone (optional)">
          <input id="phone" />
        </FormItem>
        <FormItem
          name="description"
          labelText="Description*"
          description="Start with a brief description of what you would like to have tattooed. Be more specific if you would like a custom design. As much context and reference as possible."
        >
          <textarea
            id="description"
            required
            rows={6}
            maxLength={500}
            aria-label="Enter a brief description of what you would like to have tattooed"
          ></textarea>
        </FormItem>
        <FormItem
          name="sizing"
          labelText="Sizing*"
          description="What size would you like? Rougly, in centimetres."
        >
          <input id="sizing" required />
        </FormItem>
        <FormItem
          name="placement"
          labelText="Placement*"
          description="Where on your body do you want this tattoo? Be as precise as possible. For example: Inner left forearm, front of right thigh."
        >
          <input id="placement" required />
        </FormItem>
        <FormItem
          name="references"
          labelText="References*"
          description="Attach up to five reference images related to your idea."
        >
          <input
            id="references"
            type="file"
            accept="image/png image/jpeg"
            multiple
            required
          />
        </FormItem>
        <p>
          To secure your booking a deposit of $100 per appointment will be
          reqiured (dependent on the size of your tattoo) via bank transfer or
          cash to the studio, which will come out of the total cost of the
          tattoo. Within the transaction description, please include your full
          name and the date and time of the appointment.
        </p>
        <p>
          Not arriving to your appointment will lead to the complete loss of
          that $100 deposit.
        </p>
        <p>
          BY MAKING A BOOKING THROUGH THIS WEBSITE YOU ACKNOWLEDGE THAT ALL
          DEPOSITS ARE NON-REFUNDABLE.
        </p>
        <p>
          Reschedules are not permitted within 24h prior to the appointment.
        </p>
        <p>
          Dates can be locked in for you but if a deposit is not received within
          24h, that spot will no longer be reserved.
        </p>
        <p>Designs are not sent via dm or email prior to the appointment.</p>
        <p>
          Thank you for your support, and for taking the time to read through
          and fill out this booking form. We look forward to seeing you!
        </p>
        <p>
          <input
            className={styles.RequiredCheckbox}
            id="agree"
            type="checkbox"
            required
            onClick={() => dispatch({ type: BookingsActionKind.AGREE_TOGGLED })}
          />
          <label className={styles.RequiredLabel} htmlFor="agree">
            I agree to the above
          </label>
        </p>
        <button
          className={
            submitEnabled
              ? `${styles.SubmitButton} ${styles.SubmitButton_Enabled}`
              : styles.SubmitButton
          }
          disabled={!submitEnabled || state.isSaving}
        >
          {state.isSaving ? (
            <SpinnerCircular color="var(--fg)" style={{ height: "20px" }} />
          ) : (
            "Submit"
          )}
        </button>
      </form>
    </>
  );
};

export default BookingsPage;
