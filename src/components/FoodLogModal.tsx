import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { aiAnalyzePhoto } from "@/lib/ai.functions";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
  onLogged: () => void;
}

const MEAL_TYPES = ["breakfast", "lunch", "snack", "dinner"] as const;

export function FoodLogModal({ open, onOpenChange, userId, onLogged }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const analyzeFn = useServerFn(aiAnalyzePhoto);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [mealType, setMealType] = useState<typeof MEAL_TYPES[number]>("lunch");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setPreview(null); setFile(null);
    setName(""); setPrice(""); setCalories(""); setProtein("");
    setQuantity("1"); setMealType("lunch"); setNotes("");
  };

  const handleFile = async (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setPreview(b64);
      setAnalyzing(true);
      try {
        const r = await analyzeFn({ data: { imageBase64: b64 } });
        if (r.name) setName(r.name);
        if (r.calories) setCalories(String(r.calories));
        if (r.protein_g) setProtein(String(r.protein_g));
        if (r.estimated_price) setPrice(String(r.estimated_price));
        toast.success("AI detected nutrition info");
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(f);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return toast.error("Name and price required");
    setSaving(true);

    let photoUrl: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("food-photos").upload(path, file);
      if (upErr) { setSaving(false); return toast.error(upErr.message); }
      photoUrl = path;
    }

    const { error } = await supabase.from("meal_logs").insert({
      user_id: userId,
      dish_name: name.trim(),
      price: Number(price) * Number(quantity || 1),
      calories: Math.round(Number(calories || 0) * Number(quantity || 1)),
      protein_g: Number(protein || 0) * Number(quantity || 1),
      quantity: Number(quantity || 1),
      type: "moderate",
      meal_type: mealType,
      notes: notes.trim() || null,
      photo_url: photoUrl,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Meal logged");
    reset();
    onLogged();
    onOpenChange(false);
  };

  const totalCost = (Number(price || 0) * Number(quantity || 1)).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">📸 Log Food Item</DialogTitle>
          <DialogDescription>Snap or describe what you ate — we'll handle the rest.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-accent transition-colors"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
              ) : (
                <>
                  <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div className="font-medium mt-2">Tap to upload food photo</div>
                  <div className="text-xs text-muted-foreground">JPG, PNG — AI will auto-detect nutrition</div>
                </>
              )}
            </button>
            {analyzing && (
              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-primary">
                <Sparkles className="h-4 w-4 animate-pulse" /> Analyzing...
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="fn">Food name *</Label>
            <Input id="fn" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Paneer Burger" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pp">Price paid (₹) *</Label>
              <Input id="pp" type="number" min={0} step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="qty">Quantity</Label>
              <Input id="qty" type="number" min={1} step="0.5" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cal">Calories (per item)</Label>
              <Input id="cal" type="number" min={0} value={calories} onChange={e => setCalories(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pro">Protein (g)</Label>
              <Input id="pro" type="number" min={0} value={protein} onChange={e => setProtein(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mt">Meal type</Label>
              <select
                id="mt"
                value={mealType}
                onChange={e => setMealType(e.target.value as any)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {MEAL_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="nt">Notes</Label>
              <Input id="nt" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional note" />
            </div>
          </div>

          <div className="bg-muted rounded-xl px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Total cost</div>
            <div className="text-xl font-bold text-amber-700">₹{totalCost}</div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving || analyzing} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Log
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
