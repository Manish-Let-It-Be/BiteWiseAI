import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Dish } from "@/lib/queries";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
  editing?: Dish | null;
  onSaved: () => void;
}

export function AddDishModal({ open, onOpenChange, userId, editing, onSaved }: Props) {
  const [name, setName] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [price, setPrice] = useState("");
  const [calories, setCalories] = useState("");
  const [type, setType] = useState<"healthy" | "moderate" | "indulgent">("moderate");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setPlaceName(editing.place_name ?? "");
      setPrice(String(editing.price));
      setCalories(String(editing.calories));
      setType(editing.type);
      setTags(editing.tags?.join(", ") ?? "");
    } else if (open) {
      setName(""); setPlaceName(""); setPrice(""); setCalories(""); setType("moderate"); setTags("");
    }
  }, [editing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      user_id: userId,
      name: name.trim(),
      place_name: placeName.trim() || null,
      price: Number(price),
      calories: Number(calories),
      type,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      is_default: false,
    };
    const { error } = editing
      ? await supabase.from("dishes").update(payload).eq("id", editing.id)
      : await supabase.from("dishes").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Dish updated" : "Dish added to library");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{editing ? "Edit dish" : "Add a dish"}</DialogTitle>
          <DialogDescription>Build your personal local food library.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="d-name">Dish name</Label>
            <Input id="d-name" value={name} onChange={e => setName(e.target.value)} required placeholder="Ram Kaka's Chole Bhature" />
          </div>
          <div>
            <Label htmlFor="d-place">Place (optional)</Label>
            <Input id="d-place" value={placeName} onChange={e => setPlaceName(e.target.value)} placeholder="Ram Kaka Corner" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="d-price">Price (₹)</Label>
              <Input id="d-price" type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="d-cal">Calories</Label>
              <Input id="d-cal" type="number" min={0} value={calories} onChange={e => setCalories(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="healthy">🥗 Healthy</SelectItem>
                <SelectItem value="moderate">🍛 Moderate</SelectItem>
                <SelectItem value="indulgent">🍟 Indulgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="d-tags">Tags (comma-separated)</Label>
            <Input id="d-tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="spicy, filling, street food" />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : editing ? "Save changes" : "Add dish"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
