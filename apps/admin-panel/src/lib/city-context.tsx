"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "./api";

// Assuming City type mirrors the backend
interface City {
  id: number;
  name: string;
  slug: string;
  state: string;
  is_active: boolean;
}

interface CityContextType {
  cities: City[];
  selectedCityId: number | null;
  selectedCity: City | null;
  setSelectedCityId: (id: number | null) => void;
  isLoading: boolean;
  error: string | null;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: ReactNode }) {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch cities if we are logged in (i.e., not on the login page)
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      const fetchCities = async () => {
        setIsLoading(true);
        try {
          const res = await api.get("/admin/cities/");
          // Handle DRF's ListAPIView response (raw list or paginated)
          let cityList: City[];
          if (Array.isArray(res.data)) {
            cityList = res.data;
          } else if (res.data?.results) {
            cityList = res.data.results;
          } else if (res.data?.data) {
            cityList = Array.isArray(res.data.data) ? res.data.data : [];
          } else {
            cityList = [];
          }
          const activeCities = cityList.filter((c: City) => c.is_active);
          setCities(activeCities);
            
          // Auto-select first city if none selected
          const savedCityId = localStorage.getItem("admin_selected_city_id");
          if (savedCityId && activeCities.find((c: City) => c.id === Number(savedCityId))) {
            setSelectedCityId(Number(savedCityId));
          } else if (activeCities.length > 0) {
            setSelectedCityId(activeCities[0].id);
            localStorage.setItem("admin_selected_city_id", activeCities[0].id.toString());
          }
        } catch (err: any) {
          setError(err.message || "Failed to load cities");
        } finally {
          setIsLoading(false);
        }
      };

      fetchCities();
    } else {
        setIsLoading(false);
    }
  }, []);

  const handleSetSelectedCityId = (id: number | null) => {
    setSelectedCityId(id);
    if (id !== null) {
      localStorage.setItem("admin_selected_city_id", id.toString());
    } else {
      localStorage.removeItem("admin_selected_city_id");
    }
  };

  const selectedCity = selectedCityId ? cities.find((c) => c.id === selectedCityId) || null : null;

  return (
    <CityContext.Provider
      value={{
        cities,
        selectedCityId,
        selectedCity,
        setSelectedCityId: handleSetSelectedCityId,
        isLoading,
        error,
      }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error("useCity must be used within a CityProvider");
  }
  return context;
}
