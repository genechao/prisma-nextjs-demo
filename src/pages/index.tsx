import { useEffect, useMemo, useState } from 'react'
import { ApiResponse, Category, Item, ItemType, Snapshot } from '../lib/types'

// This file defines the frontend UI for the Prisma Next.js demo.
// It interacts with the backend API route (i.e., /api/actions)
// which handle database operations using Prisma.

// Common style constants for form elements using Tailwind CSS.
// This approach keeps the UI code simple for demonstration purposes.

// Base styles for all inputs
const inputBaseClasses = 'border rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary'

// Base styles for all selects
const selectBaseClasses = 'border rounded px-2 py-1 bg-input text-foreground w-full focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary'

// Common classes for all buttons (transitions, focus)
const buttonCommonClasses = 'rounded text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary'

// Specific button variants
const primaryButtonClasses = `${buttonCommonClasses} bg-primary text-primary-foreground hover:opacity-90`
const secondaryButtonClasses = `${buttonCommonClasses} bg-muted hover:bg-secondary`
const destructiveButtonClasses = `${buttonCommonClasses} bg-destructive text-white hover:opacity-90`

// Specific button paddings/sizes (can be combined with variants)
const buttonPaddingSm = 'px-3 py-1'
const buttonPaddingMd = 'px-3 py-2'
const buttonPaddingXs = 'px-2 py-1'

export default function Home() {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/actions')
      const data: ApiResponse = await res.json()
      if (!data.ok) throw new Error(data.message || 'Failed to load')
      setSnap(data.snapshot || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const submit = async (action: string, payload: Record<string, unknown>) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEMO_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ action, payload }),
      })
      const data: ApiResponse = await res.json()
      if (!data.ok) throw new Error(data.message || 'Request failed')
      setSnap(data.snapshot || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setBusy(false)
    }
  }

  // Memoize the list of items available for checkout (i.e., not currently loaned)
  const availableItems = useMemo(() => (snap?.items || []).filter(i => !i.currentLoan), [snap])

  return (
    // Baseline (constrained) layout — keep these to restore the default demo baseline:
    //   Root (page padding):            className="min-h-screen px-4 sm:px-6 lg:px-8 py-8"
    //   Inner wrapper (constrain width): className="mx-auto max-w-3xl flex flex-col gap-8"
    // To switch to a wide, full-width layout, replace the root padding with:
    //   px-4 py-8 sm:px-8 md:px-16 lg:px-32 xl:px-48 2xl:px-64
    // and remove or change the inner wrapper (e.g. use `w-full` or omit the `max-w-3xl` class).
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-3xl flex flex-col gap-8">
        <header>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-balance">Prisma in Next.js Demo</h1>
          <p className="text-sm text-muted-foreground">Simple demo of CRUD + relations</p>
        </header>

        <main className="flex flex-col gap-6">
          {error && <div className="rounded border border-destructive bg-popover p-3 text-sm text-destructive">{error}</div>}

          <section className="flex items-center gap-3">
            <button
              className={`${primaryButtonClasses} ${buttonPaddingMd} disabled:opacity-50`}
              disabled={busy}
              onClick={refresh}
            >Reload</button>
            {busy && <span className="text-sm text-muted-foreground">Working…</span>}
            <a
              href="/api/actions"
              target="_blank"
              rel="noopener noreferrer"
              className={`${primaryButtonClasses} ${buttonPaddingMd}`}
            >Open API</a>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-balance">Quick Creates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickCreateItemType onSubmit={(code, name) => submit('createItemType', { code, name })} />
              <QuickCreateCategory onSubmit={(code, name, parentId) => submit('createCategory', { code, name, parentId })} categories={snap?.categories || []} />
              <QuickCreateItem onSubmit={(title, itemTypeId, requestedBy) => submit('createItem', { title, itemTypeId, requestedBy })} itemTypes={snap?.itemTypes || []} />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-balance">Link Categories</h2>
            <LinkCategoryForm items={snap?.items || []} categories={snap?.categories || []} onLink={(itemId, categoryId) => submit('linkCategory', { itemId, categoryId })} onUnlink={(itemId, categoryId) => submit('unlinkCategory', { itemId, categoryId })} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-balance">Checkout / Return</h2>
            <CheckoutForm items={availableItems} onCheckout={(itemId, patronName) => submit('checkout', { itemId, patronName })} />
            <ReturnForm items={snap?.items || []} onReturn={(itemId) => submit('return', { itemId })} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-balance">All Items</h2>
            <div className="flex flex-col divide-y divide-border border rounded">
              {snap?.items && snap.items.length === 0 && (
                <div className="p-3 flex flex-col gap-2 text-center">
                  <div className="font-medium">No items yet</div>
                  <div className="text-sm text-muted-foreground">Use the Quick Creates section above to add an item.</div>
                </div>
              )}
              {(snap?.items || []).map(item => (
                <div key={item.id} className="p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">#{item.id} {item.title}</div>
                    <button className={`${destructiveButtonClasses} ${buttonPaddingXs} text-xs`} onClick={() => submit('deleteItem', { id: item.id })}>Delete</button>
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5">Type: {item.itemType.name}</span>
                    <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5">
                      Categories: {item.categories.length ? item.categories.map(c => c.name).join(', ') : '—'}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${item.currentLoan ? 'bg-yellow-100 dark:bg-yellow-800' : 'bg-green-100 dark:bg-green-800'}`}>
                      {item.currentLoan ? `Loaned to ${item.currentLoan.patronName}` : 'Available'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function QuickCreateItemType({ onSubmit }: { onSubmit: (code: string, name: string) => void }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  return (
    <form className="border rounded p-3 flex flex-col gap-2" onSubmit={e => { e.preventDefault(); onSubmit(code, name); setCode(''); setName('') }}>
      <div className="font-medium">Item Type</div>
      <p className="text-xs text-muted-foreground -mt-1 mb-1">Defines the general type of an asset (e.g., Book, Laptop).</p>
      <input className={inputBaseClasses} placeholder="Code (e.g., BK)" value={code} onChange={e => setCode(e.target.value)} />
      <input className={inputBaseClasses} placeholder="Name (e.g., Book)" value={name} onChange={e => setName(e.target.value)} />
      <button className={`${primaryButtonClasses} ${buttonPaddingSm}`} type="submit">Create</button>
    </form>
  )
}

function QuickCreateCategory({ onSubmit, categories }: { onSubmit: (code: string, name: string, parentId?: number | null) => void, categories: Category[] }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState<number | null>(null)
  return (
    <form className="border rounded p-3 flex flex-col gap-2" onSubmit={e => { e.preventDefault(); onSubmit(code, name, parentId); setCode(''); setName(''); setParentId(null) }}>
      <div className="font-medium">Category</div>
      <p className="text-xs text-muted-foreground -mt-1 mb-1">Organizes items into groups (e.g., Fiction, Technology).</p>
      <input className={inputBaseClasses} placeholder="Code (e.g., sci-fi)" value={code} onChange={e => setCode(e.target.value)} />
      <input className={inputBaseClasses} placeholder="Name (e.g., Science Fiction)" value={name} onChange={e => setName(e.target.value)} />
      <p className="text-xs text-muted-foreground">Assign parent to create a hierarchy (e.g., Fiction &gt; Sci-Fi).</p>
      <select className={selectBaseClasses} value={parentId ?? ''} onChange={e => setParentId(e.target.value === '' ? null : (Number.isInteger(Number(e.target.value)) ? Number(e.target.value) : null))}>
        <option value="">Parent (optional)</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button className={`${primaryButtonClasses} ${buttonPaddingSm}`} type="submit">Create</button>
    </form>
  )
}

function QuickCreateItem({ onSubmit, itemTypes }: { onSubmit: (title: string, itemTypeId: number, requestedBy?: string | null) => void, itemTypes: ItemType[] }) {
  const [title, setTitle] = useState('')
  const [typeId, setTypeId] = useState<number | null>(null)
  const [requestedBy, setRequestedBy] = useState('')
  return (
    <form className="border rounded p-3 flex flex-col gap-2" onSubmit={e => { e.preventDefault(); onSubmit(title, Number(typeId), requestedBy || null); setTitle(''); setTypeId(null); setRequestedBy('') }}>
      <div className="font-medium">Item</div>
      <p className="text-xs text-muted-foreground -mt-1 mb-1">Create a new item, linking it to an Item Type.</p>
      <input className={inputBaseClasses} placeholder="Title (e.g., Learning Prisma)" value={title} onChange={e => setTitle(e.target.value)} />
      <select className={selectBaseClasses} value={typeId ?? ''} onChange={e => setTypeId(e.target.value === '' ? null : (Number.isInteger(Number(e.target.value)) ? Number(e.target.value) : null))}>
        <option value="">Item Type</option>
        {itemTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <input className={inputBaseClasses} placeholder="Requested by (optional, e.g., Alice)" value={requestedBy} onChange={e => setRequestedBy(e.target.value)} />
      <button className={`${primaryButtonClasses} ${buttonPaddingSm}`} type="submit">Create</button>
    </form>
  )
}

function LinkCategoryForm({ items, categories, onLink, onUnlink }: { items: Item[], categories: Category[], onLink: (itemId: number, categoryId: number) => void, onUnlink: (itemId: number, categoryId: number) => void }) {
  const [itemId, setItemId] = useState<number | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  return (
    <form className="border rounded p-3 flex flex-col gap-2" onSubmit={e => { e.preventDefault(); onLink(Number(itemId), Number(categoryId)); }}>
      {/* <div className="font-medium">Link/Unlink Categories</div> */}
      <p className="text-xs text-muted-foreground -mt-1 mb-1">Associate an item with one or more categories.</p>
      <div className="flex flex-wrap gap-2 items-center">
        <select className={selectBaseClasses} value={itemId ?? ''} onChange={e => setItemId(e.target.value === '' ? null : (Number.isInteger(Number(e.target.value)) ? Number(e.target.value) : null))}>
          <option value="">Item</option>
          {items.map(i => <option key={i.id} value={i.id}>#{i.id} {i.title}</option>)}
        </select>
        <select className={selectBaseClasses} value={categoryId ?? ''} onChange={e => setCategoryId(e.target.value === '' ? null : (Number.isInteger(Number(e.target.value)) ? Number(e.target.value) : null))}>
          <option value="">Category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className={`${primaryButtonClasses} ${buttonPaddingSm}`} type="submit">Link</button>
        <button className={`${secondaryButtonClasses} ${buttonPaddingSm}`} type="button" onClick={() => { onUnlink(Number(itemId), Number(categoryId)) }}>Unlink</button>
      </div>
    </form>
  )
}

function CheckoutForm({ items, onCheckout }: { items: Item[], onCheckout: (itemId: number, patronName: string) => void }) {
  const [itemId, setItemId] = useState<number | null>(null)
  const [patronName, setPatronName] = useState('')
  return (
    <form className="border rounded p-3 flex flex-col gap-2" onSubmit={e => { e.preventDefault(); onCheckout(Number(itemId), patronName); setPatronName('') }}>
      {/* <div className="font-medium">Checkout Item</div> */}
      <p className="text-xs text-muted-foreground -mt-1 mb-1">Assign an available item to a patron.</p>
      <div className="flex flex-wrap gap-2 items-center">
        <select className={selectBaseClasses} value={itemId ?? ''} onChange={e => setItemId(e.target.value === '' ? null : (Number.isInteger(Number(e.target.value)) ? Number(e.target.value) : null))}>
          <option value="">Available Item</option>
          {items.map(i => <option key={i.id} value={i.id}>#{i.id} {i.title}</option>)}
        </select>
        <input className={inputBaseClasses} placeholder="Patron name (e.g., Bob)" value={patronName} onChange={e => setPatronName(e.target.value)} />
        <button className={`${primaryButtonClasses} ${buttonPaddingSm}`} type="submit">Checkout</button>
      </div>
    </form>
  )
}

function ReturnForm({ items, onReturn }: { items: Item[], onReturn: (itemId: number) => void }) {
  const withLoans = items.filter(i => !!i.currentLoan)
  const [itemId, setItemId] = useState<number | null>(null)
  return (
    <form className="border rounded p-3 flex flex-col gap-2" onSubmit={e => { e.preventDefault(); onReturn(Number(itemId)) }}>
      {/* <div className="font-medium">Return Item</div> */}
      <p className="text-xs text-muted-foreground -mt-1 mb-1">Mark a loaned item as returned.</p>
      <div className="flex flex-wrap gap-2 items-center">
        <select className={selectBaseClasses} value={itemId ?? ''} onChange={e => setItemId(e.target.value === '' ? null : (Number.isInteger(Number(e.target.value)) ? Number(e.target.value) : null))}>
          <option value="">Loaned Item</option>
          {withLoans.map(i => <option key={i.id} value={i.id}>#{i.id} {i.title} → {i.currentLoan?.patronName}</option>)}
        </select>
        <button className={`${primaryButtonClasses} ${buttonPaddingSm}`} type="submit">Return</button>
      </div>
    </form>
  )
}