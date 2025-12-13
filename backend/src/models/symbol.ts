import mongoose, { Schema, Document } from 'mongoose';

export interface ISymbol extends Document {
  id: number;
  symbol: string;
  name: string;
}

const SymbolSchema: Schema = new Schema({
  id: { type: Number, unique: true },
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
}, { timestamps: true });

SymbolSchema.pre('save', async function () {
  const doc = this as unknown as ISymbol;
  if (doc.isNew) {
    const lastSymbol = await mongoose.model<ISymbol>('Symbol').findOne().sort({ id: -1 });
    doc.id = lastSymbol && lastSymbol.id ? lastSymbol.id + 1 : 1;
  }
});

export default mongoose.model<ISymbol>('Symbol', SymbolSchema);
