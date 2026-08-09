import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card'
import { Input } from '@/components/shadcn/input'
import { createNoteRequest, deleteNoteRequest, listNotesRequest } from '@/features/notes/api'
import { useAuth } from '@/hooks/useAuth'
import { useLogout, useLogoutAll } from '@/hooks/useLogout'

export function DashboardPage() {
  const { user } = useAuth()
  const logout = useLogout()
  const logoutAll = useLogoutAll()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const notesQuery = useQuery({ queryKey: ['notes'], queryFn: listNotesRequest })

  const createNote = useMutation({
    mutationFn: createNoteRequest,
    onSuccess: () => {
      setTitle('')
      setBody('')
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const deleteNote = useMutation({
    mutationFn: deleteNoteRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user?.email} · role: {user?.role}
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin">Admin panel</Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => logoutAll.mutate()}>
            Log out everywhere
          </Button>
          <Button variant="secondary" size="sm" onClick={() => logout.mutate()}>
            Log out
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your notes</CardTitle>
          <p className="text-xs text-muted-foreground">
            Example ownership-scoped resource — every query here is filtered by owner in the service layer, not
            just checked in the UI.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!title.trim() || !body.trim()) return
              createNote.mutate({ title, body })
            }}
          >
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
            <Button type="submit" size="sm" disabled={createNote.isPending} className="self-start">
              {createNote.isPending ? 'Adding…' : 'Add note'}
            </Button>
          </form>

          {notesQuery.isLoading && <p className="text-sm text-muted-foreground">Loading notes…</p>}

          <ul className="flex flex-col gap-2">
            {notesQuery.data?.map((note) => (
              <li key={note.id} className="flex items-start justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{note.title}</p>
                  <p className="text-sm text-muted-foreground">{note.body}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteNote.mutate(note.id)}>
                  Delete
                </Button>
              </li>
            ))}
            {notesQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet — add one above.</p>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
