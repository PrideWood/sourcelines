export type SubmitFieldErrors = {
  original_text?: string;
  language?: string;
  raw_work_title?: string;
  raw_author_name?: string;
  genre_type?: string;
  raw_source_location?: string;
  evidence?: string;
  tag_ids?: string;
};

export type SubmitFormState = {
  formError?: string;
  fieldErrors: SubmitFieldErrors;
  values: {
    original_text: string;
    language: string;
    raw_work_title: string;
    raw_author_name: string;
    speaker_name: string;
    genre_type: string;
    raw_source_location: string;
    raw_translated_text: string;
    raw_note: string;
    evidence_url: string;
    tag_ids: string[];
  };
};

export const initialSubmitFormState: SubmitFormState = {
  fieldErrors: {},
  values: {
    original_text: "",
    language: "",
    raw_work_title: "",
    raw_author_name: "",
    speaker_name: "",
    genre_type: "unknown",
    raw_source_location: "",
    raw_translated_text: "",
    raw_note: "",
    evidence_url: "",
    tag_ids: [],
  },
};
