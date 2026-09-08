"use client"

import React, { useEffect, useActionState } from "react"
import Input from "@modules/common/components/input"
import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { updateCustomer } from "@lib/data/customer"
import { useTranslations } from "next-intl"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileUsername: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)
  const t = useTranslations("Account.Profile")

  const updateCustomerUsername = async (
    _currentState: unknown,
    formData: FormData
  ) => {
    const username = formData.get("username") as string

    try {
      await updateCustomer({
        metadata: {
          ...(customer.metadata || {}),
          username,
        },
      })
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: error.toString() }
    }
  }

  const [state, formAction] = useActionState(updateCustomerUsername, {
    error: null,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  const currentUsername = (customer.metadata?.username as string) || "-"

  return (
    <form action={formAction} className="w-full">
      <AccountInfo
        label={t("username")}
        currentInfo={currentUsername}
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error}
        clearState={clearState}
        data-testid="account-username-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          <Input
            label={t("username")}
            name="username"
            required
            defaultValue={(customer.metadata?.username as string) || ""}
            data-testid="username-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileUsername
