import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Item } from "../types";
import type { ItemFormValues } from "../types";
import { formSchema } from "../types";
import { useTranslation } from "react-i18next";

export interface ItemModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<Item>) => void;
  canEdit: boolean;
}

export function ItemModal({
  item,
  isOpen,
  onClose,
  onSave,
  canEdit,
}: ItemModalProps) {
  const { t } = useTranslation();
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customId: item?.customId ?? "",
      string1: item?.string1 ?? "",
      int1: item?.int1 ?? null,
      bool1: item?.bool1 ?? false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        customId: item?.customId ?? "",
        string1: item?.string1 ?? "",
        int1: item?.int1 ?? null,
        bool1: item?.bool1 ?? false,
      });
    }
  }, [item, isOpen, form]);

  const handleSubmit = (values: ItemFormValues) => {
    const updated: Partial<Item> = {
      ...item,
      customId: values.customId,
      string1: values.string1,
      int1: values.int1,
      bool1: values.bool1,
    };

    onSave(updated);
    onClose();
  };
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? t("editItem") : t("addItem")}</DialogTitle>
          <DialogDescription>{t("fillForm")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="customId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("customId")}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!canEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="string1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("string1")}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!canEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="int1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("int1")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      disabled={!canEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bool1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bool1")}</FormLabel>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={!canEdit}
                      className="mr-2"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              {canEdit && <Button type="submit">{t("save")}</Button>}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
