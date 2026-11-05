import { useState } from 'react'
import { Alert } from '@mui/material'

import MainLayout from '@/components/layout/MainLayout'
import { useNotify } from '@/components/layout/NotificationProvider'
import { AddButton } from '@/components/common/AddButton'
import { ContentCard } from '@/components/common/ContentCard'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { SuspendUserDialog } from '@/components/users/SuspendUserDialog'
import { UserFilters } from '@/components/users/UserFilters'
import { getFullName } from '@/components/users/userLabels'
import { UserFormDialog } from '@/components/users/UserFormDialog'
import { UsersTable } from '@/components/users/UsersTable'
import { useUsers } from '@/hooks/useUsers'
import { activateUser, suspendUser, type UserListItem } from '@/services/users.service'
import '@/pages/usersMock'

const UsersPage = () => {
  const notify = useNotify()
  const q = useUsers()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<UserListItem | null>(null)
  const [toToggle, setToToggle] = useState<UserListItem | null>(null)
  const [toggling, setToggling] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (user: UserListItem) => {
    setEditing(user)
    setFormOpen(true)
  }

  const confirmToggle = async () => {
    if (!toToggle) return
    setToggling(true)
    try {
      if (toToggle.active) {
        await suspendUser(toToggle.id)
        notify.success(`${getFullName(toToggle)} fue suspendido`)
      } else {
        await activateUser(toToggle.id)
        notify.success(`${getFullName(toToggle)} fue reactivado`)
      }
      setToToggle(null)
      q.reload()
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'No se pudo completar la operación')
    } finally {
      setToggling(false)
    }
  }

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Usuarios del sistema"
          subtitle="Administrá los accesos y roles de los usuarios."
          breadcrumbs={[{ label: 'Inicio', href: '/home' }, { label: 'Usuarios' }]}
          action={<AddButton label="Nuevo usuario" onClick={openCreate} />}
        />

        <ContentCard>
          <UserFilters
            search={q.search}
            role={q.role}
            active={q.active}
            onSearchChange={q.setSearch}
            onRoleChange={q.setRole}
            onActiveChange={q.setActive}
          />

          {q.error && (
            <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
              {q.error}
            </Alert>
          )}

          <UsersTable
            users={q.users}
            total={q.total}
            loading={q.loading}
            page={q.page}
            rowsPerPage={q.rowsPerPage}
            onPageChange={q.setPage}
            onRowsPerPageChange={q.setRowsPerPage}
            onEdit={openEdit}
            onToggleActive={setToToggle}
          />
        </ContentCard>
      </PageContainer>

      <UserFormDialog
        open={formOpen}
        user={editing}
        onClose={() => setFormOpen(false)}
        onSaved={q.reload}
      />

      <SuspendUserDialog
        open={!!toToggle}
        user={toToggle}
        loading={toggling}
        onConfirm={confirmToggle}
        onClose={() => setToToggle(null)}
      />
    </MainLayout>
  )
}

export default UsersPage
