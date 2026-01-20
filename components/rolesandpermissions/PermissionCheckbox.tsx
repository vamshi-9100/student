interface Props {
  code: string;
  checked: boolean;
  onToggle: () => void;
}

export default function PermissionCheckbox({ code, checked, onToggle }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={onToggle} />
      {code}
    </label>
  );
}
