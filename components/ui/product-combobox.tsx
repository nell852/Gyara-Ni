"use client"

import React, { useEffect, useRef, useState } from "react"

interface Product {
  id: string
  name: string
  price?: number
  barcode?: string
  categories?: { name: string } | null
  inventory?: any[]
}

interface Props {
  products: Product[]
  value?: string // product id (selected)
  onValueChange: (id: string) => void
  placeholder?: string
  emptyMessage?: string
}

function normalize(s: string) {
  return s?.toLowerCase().normalize("NFKD").replace(/\u0300-\u036f/g, "")
}

function matchesQuery(productName: string, q: string) {
  if (!q) return true
  const name = normalize(productName)
  const query = q.toLowerCase().trim()

  // 1) match beginning of any word
  const words = name.split(/\s+/)
  if (words.some((w) => w.startsWith(query))) return true

  // 2) match anywhere
  if (name.includes(query)) return true

  // 3) match initials: e.g. "Banana Yellow" -> "by"
  const initials = words.map((w) => w[0] || "").join("")
  if (initials.startsWith(query.replace(/\s+/g, ""))) return true

  return false
}

export const ProductCombobox: React.FC<Props> = ({
  products,
  value,
  onValueChange,
  placeholder = "Sélectionner un produit...",
  emptyMessage = "Aucun produit trouvé.",
}) => {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Sync input label with selected value (id)
  useEffect(() => {
    if (!value) {
      setQuery("")
      return
    }
    const p = products.find((x) => x.id === value)
    if (p) setQuery(p.name)
  }, [value, products])

  // Filter products
  const filtered = products.filter((p) => matchesQuery(p.name, query)).slice(0, 50)

  // Click outside -> close dropdown
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  // keyboard handling
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter") {
      if (open && filtered[highlight]) {
        e.preventDefault()
        const sel = filtered[highlight]
        setQuery(sel.name)
        onValueChange(sel.id)
        setOpen(false)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const selectProduct = (p: Product) => {
    setQuery(p.name)
    onValueChange(p.id)
    setOpen(false)
    // focus back to input
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="product-combobox-list"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setHighlight(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full border border-muted rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
      />

      {/* Dropdown */}
      {open && (
        <div
          id="product-combobox-list"
          role="listbox"
          aria-label="Produits"
          className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            filtered.map((p, i) => {
              const isHighlighted = i === highlight
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={value === p.id}
                  onMouseDown={(ev) => {
                    // use onMouseDown to avoid blur before click
                    ev.preventDefault()
                    selectProduct(p)
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`w-full text-left px-3 py-2 hover:bg-accent/30 focus:bg-accent/30 transition ${
                    isHighlighted ? "bg-accent/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.inventory?.[0]?.quantity ?? "-"} unités
                    </span>
                  </div>
                  {p.categories?.name && (
                    <div className="text-xs text-muted-foreground mt-1">{p.categories.name}</div>
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default ProductCombobox
