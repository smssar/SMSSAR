/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useRef } from "react";
import ReactSelect, {
  type SelectInstance,
  type SingleValue,
} from "react-select";
import type { Locale } from "@/lib/locales";

type LocalizedItem = {
  name: string;
  name_ar?: string | null;
  name_fr?: string | null;
};

type City = LocalizedItem;

type Neighborhood = LocalizedItem & {
  id: string;
  city: { name: string };
};

type Option = {
  value: string;
  label: string;
};

type Props = {
  cities: City[];
  neighborhoods: Neighborhood[];
  cityName?: string;
  neighborhoodId?: string;
  onCityChange: (name: string) => void;
  onNeighborhoodChange: (id: string) => void;
  locale: Locale;
  cityError?: string | null;
  neighborhoodError?: string | null;
};

const getLabel = (locale: Locale, item: LocalizedItem) => {
  if (locale === "ar") return item.name_ar || item.name;
  if (locale === "fr") return item.name_fr || item.name;
  return item.name;
};

const customStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: 44,
    borderRadius: 24,
    borderColor: state.isFocused ? "#7c3aed" : "rgba(148, 163, 184, 0.7)",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(124, 58, 237, 0.1)" : "none",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  }),

  valueContainer: (provided: any) => ({
    ...provided,
    color: "var(--foreground)",
  }),

  input: (provided: any) => ({
    ...provided,
    color: "var(--foreground)",
  }),

  singleValue: (provided: any) => ({
    ...provided,
    color: "var(--foreground)",
  }),

  placeholder: (provided: any) => ({
    ...provided,
    color: "var(--muted-foreground)",
  }),

  menu: (provided: any) => ({
    ...provided,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    zIndex: 9999,
  }),

  menuList: (provided: any) => ({
    ...provided,
    backgroundColor: "#fff",
    color: "#000",
  }),

  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#7c3aed"
      : state.isFocused
        ? "rgba(124,58,237,0.12)"
        : "var(--foreground)",
    color: state.isSelected ? "#fff" : "var(--foreground)",
    cursor: "pointer",
  }),

  noOptionsMessage: (provided: any) => ({
    ...provided,
    color: "var(--muted-foreground)",
    backgroundColor: "var(--background)",
  }),

  clearIndicator: (provided: any) => ({
    ...provided,
    color: "var(--foreground)",
  }),

  dropdownIndicator: (provided: any) => ({
    ...provided,
    color: "var(--foreground)",
  }),

  indicatorSeparator: (provided: any) => ({
    ...provided,
    backgroundColor: "var(--border)",
  }),
};
export default function CityNeighborhoodSelector({
  cities,
  neighborhoods,
  cityName,
  neighborhoodId,
  onCityChange,
  onNeighborhoodChange,
  locale,
}: Props) {
  const citySelectRef = useRef<SelectInstance<Option, false> | null>(null);
  const neighborhoodSelectRef = useRef<SelectInstance<Option, false> | null>(
    null,
  );
  const cityOptions: Option[] = useMemo(
    () =>
      cities.map((city) => ({
        value: city.name,
        label: getLabel(locale, city),
      })),
    [cities, locale],
  );

  const neighborhoodOptions: Option[] = useMemo(
    () =>
      neighborhoods
        .filter((neighborhood) =>
          cityName ? neighborhood.city.name === cityName : true,
        )
        .map((neighborhood) => ({
          value: neighborhood.id,
          label: getLabel(locale, neighborhood),
        })),
    [neighborhoods, cityName, locale],
  );

  const selectedCity =
    cityOptions.find((option) => option.value === cityName) ?? null;
  const selectedNeighborhood = (() => {
    if (!neighborhoodId) return null;
    const byValue = neighborhoodOptions.find(
      (option) => option.value === neighborhoodId,
    );
    if (byValue) return byValue;

    // Listing form stores neighborhood as the raw `name` string in state
    const foundByName = neighborhoods.find((n) => n.name === neighborhoodId);
    if (foundByName) {
      return (
        neighborhoodOptions.find((option) => option.value === foundByName.id) ??
        null
      );
    }

    return null;
  })();

  const placeholderCity =
    locale === "ar"
      ? "اختر مدينة أو ابحث عنها"
      : locale === "fr"
        ? "Sélectionnez ou recherchez une ville"
        : "Select or search city";

  const placeholderNeighborhood =
    locale === "ar"
      ? "اختر حيًا أو ابحث عنه"
      : locale === "fr"
        ? "Sélectionnez ou recherchez un quartier"
        : "Select or search neighborhood";

  return (
    <div className="grid gap-4">
      <div>
        <ReactSelect
          ref={citySelectRef}
          options={cityOptions}
          value={selectedCity}
          onChange={(option: SingleValue<Option>) => {
            onCityChange(option?.value ?? "");
            onNeighborhoodChange("");
          }}
          inputId="city-select"
          instanceId="city-select"
          onMenuOpen={() => citySelectRef.current?.focus()}
          placeholder={placeholderCity}
          styles={customStyles}
          isClearable
          isSearchable
          openMenuOnFocus
          openMenuOnClick
          className="react-select-container"
          classNamePrefix="react-select"
          menuPlacement="auto"
          menuShouldScrollIntoView
          noOptionsMessage={() =>
            locale === "ar"
              ? "لا يوجد نتيجة"
              : locale === "fr"
                ? "Aucun résultat"
                : "No options"
          }
        />
      </div>

      <div>
        <ReactSelect
          ref={neighborhoodSelectRef}
          options={neighborhoodOptions}
          value={selectedNeighborhood}
          onChange={(option: SingleValue<Option>) => {
            onNeighborhoodChange(option?.value ?? "");
          }}
          inputId="neighborhood-select"
          instanceId="neighborhood-select"
          onMenuOpen={() => neighborhoodSelectRef.current?.focus()}
          placeholder={placeholderNeighborhood}
          styles={customStyles}
          isDisabled={!cityName}
          isSearchable
          openMenuOnFocus
          openMenuOnClick
          isClearable
          className="react-select-container"
          classNamePrefix="react-select"
          menuPlacement="auto"
          menuShouldScrollIntoView
          noOptionsMessage={() =>
            !cityName
              ? locale === "ar"
                ? "اختر المدينة أولاً"
                : locale === "fr"
                  ? "Sélectionnez une ville d'abord"
                  : "Select a city first"
              : locale === "ar"
                ? "لا يوجد حي متاح"
                : locale === "fr"
                  ? "Aucun quartier disponible"
                  : "No neighborhood available"
          }
        />
      </div>
    </div>
  );
}
