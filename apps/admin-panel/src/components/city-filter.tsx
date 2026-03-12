"use client";

import { useCity } from "@/lib/city-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CityFilterDropdown() {
  const { cities, selectedCityId, setSelectedCityId, isLoading } = useCity();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground w-[180px] h-9 flex items-center px-3 border rounded-md">Loading cities...</div>;
  }

  if (cities.length === 0) {
    return <div className="text-sm text-destructive w-[180px] h-9 flex items-center px-3 border border-destructive rounded-md">No cities parsed</div>;
  }

  return (
    <Select
      value={selectedCityId?.toString() || ""}
      onValueChange={(value) => setSelectedCityId(Number(value))}
    >
      <SelectTrigger className="w-[180px] bg-background">
        <SelectValue placeholder="Select a city" />
      </SelectTrigger>
      <SelectContent>
        {cities.map((city) => (
          <SelectItem key={city.id} value={city.id.toString()}>
            {city.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
