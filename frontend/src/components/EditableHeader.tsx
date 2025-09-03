import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

type EditableHeaderProps = {
  title: string;
  description: string;
  canEdit: boolean;
  onSave: (data: { title: string; description: string }) => void;
  onEditingChange?: (isEditing: boolean) => void;
};

export function EditableHeader({
  title,
  description,
  canEdit,
  onSave,
  onEditingChange,
}: EditableHeaderProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localDescription, setLocalDescription] = useState(description);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalTitle(title);
    setLocalDescription(description);
  }, [title, description]);

  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  const focusField = useCallback(
    (field: "title" | "description") => {
      if (!canEdit || !isEditing) return;
      setTimeout(() => {
        if (field === "title") {
          titleRef.current?.focus();
        } else {
          descriptionRef.current?.focus();
        }
      }, 0);
    },
    [canEdit, isEditing]
  );

  const handleEdit = () => {
    if (!canEdit) return;
    setIsEditing(true);
    focusField("title");
  };

  const saveAndExit = () => {
    onSave({ title: localTitle, description: localDescription });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveAndExit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setLocalTitle(title);
      setLocalDescription(description);
    }
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    focusField("title");
  };

  const handleDescriptionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    focusField("description");
  };

  if (isEditing && canEdit) {
    return (
      <div className="space-y-2 mb-6">
        <input
          ref={titleRef}
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onClick={handleTitleClick}
          onBlur={saveAndExit}
          onKeyDown={handleKeyDown}
          className="text-2xl font-semibold w-full border-b-2 border-blue-500 outline-none"
          placeholder={t("inventoryTitle")}
        />
        <textarea
          ref={descriptionRef}
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          onClick={handleDescriptionClick}
          onBlur={saveAndExit}
          onKeyDown={handleKeyDown}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none outline-none focus:border-blue-500"
          placeholder={t("descriptionPlaceholder")}
        />
      </div>
    );
  }

  return (
    <div className="cursor-text mb-6 space-y-1">
      <h2
        onClick={handleEdit}
        className="text-2xl font-bold p-2 rounded hover:bg-gray-500 hover:text-white transition-colors box-content"
      >
        {title && title.trim().length > 0 ? (
          title
        ) : (
          <span className="text-gray-200 italic">{t("untitledInventory")}</span>
        )}
      </h2>
      {description && description.trim().length > 0 ? (
        <p
          onClick={handleDescriptionClick}
          className="text-sm p-2 rounded hover:bg-gray-500 hover:text-white transition-colors italic"
        >
          {description}
        </p>
      ) : (
        <p
          onClick={handleDescriptionClick}
          className="text-sm p-2 rounded hover:bg-gray-500 transition-colors italic"
        >
          {t("clickToAddDescription")}
        </p>
      )}
    </div>
  );
}
