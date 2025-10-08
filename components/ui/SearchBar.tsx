"use client";
import { useId } from "react";

export default function SearchBar({
  placeholder = "機種・タグで検索",
  defaultValue = "",
  onSearch,
}: {
  placeholder?: string;
  defaultValue?: string;
  onSearch: (q: string) => void;
}) {
  const id = useId();
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const q = (new FormData(form).get("q") || "").toString();
        onSearch(q);
      }}
    >
      <label htmlFor={id} className="sr-only">
        検索
      </label>
      <input
        id={id}
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="pixel-input"
      />
      <button className="pixel-input" type="submit">
        検索
      </button>
    </form>
  );
}
