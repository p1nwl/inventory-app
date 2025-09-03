import { useMutation, useQueryClient } from "@tanstack/react-query";
import i18n from "@/i18n";
import { handleLanguageChange } from "@/api/profile";

export function useLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: handleLanguageChange,
    onSuccess: (data) => {
      i18n.changeLanguage(data.language);
      queryClient.setQueryData<{ language: string } | undefined>(
        ["profile"],
        (old) => (old ? { ...old, language: data.language } : old)
      );
    },
  });
}
