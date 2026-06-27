export interface MemberRoleState {
  memberId: number | null
  roleIds: number[]
}

export interface MemberRoleAssignInput {
  memberId: number
  roleIds: number[]
}
