import groq from 'groq'
import { definePlugin, useWorkspace, useCurrentUser, useDocumentStore, useClient } from 'sanity'
import { Stack, Flex, Card, MenuButton, Button, Menu, MenuItem, ToastProvider, useToast, Badge } from '@sanity/ui'
import { ChevronDownIcon } from '@sanity/icons/ChevronDown'
import { map } from 'rxjs/operators'
import { useObservable } from 'react-rx'

/**
 * @typedef {Object} ContextOption
 * @property {string} id - The identifier (e.g., 'en', 'en_US').
 * @property {string} label - The display name shown to the user.
 * @property {JSX.Element} [icon] - An optional JSX element representing the icon.

 * @typedef {Object} ContextSwitch
 * @property {string} defaultValue - The default value.
 * @property {ContextOption[]} options - An array of context options, each containing `id`, `label`, and optionally `icon`.
 * @property {string} profileKey - The key used to store the selected context in the user's profile.
 * @property {string} [schemaType] - Overwrite schema type, default 'profile'

 * @typedef {Object} Options
 * @property {ContextSwitch} [contextSwitch] - An optional context switch configuration. If not defined, no context switch will be shown.
 * @property {object} clientConfig - The client configuration object.
 * @property {(e: Error) => void} reportError - A required error reporting function.
 */
export const sanityPluginNavExtend = definePlugin(
  /** @type {import('sanity').PluginFactory<Options>} */
  ({ contextSwitch, clientConfig, reportError }) => ({
    name: 'sanity-plugin-nav-extend',

    studio: {
      components: {
        navbar: (props) => NavbarExtended({ contextSwitch, clientConfig, reportError, ...props }),
      }
    }
  })
)

function NavbarExtended({ contextSwitch, clientConfig, reportError, renderDefault, ...restProps }) {
  const showContextSwitch = Boolean(contextSwitch?.options?.length)

  return (
    <Stack>
      <Card scheme='dark' borderBottom>
        <Flex justify='flex-end' gap={4} paddingY={1} paddingX={1}>
          {showContextSwitch && (
            <ContextSwitch
              defaultValue={contextSwitch.defaultValue}
              options={contextSwitch.options}
              profileKey={contextSwitch.profileKey}
              schemaType={contextSwitch.schemaType || 'profile'}
              {...{ clientConfig, reportError }}
            />
          )}
          <CurrentEnvBlock />
        </Flex>
      </Card>

      {renderDefault(restProps)}
    </Stack>
  )
}

/**
 * @typedef {import('@sanity/ui').BadgeTone} BadgeTone
 * @type {Object<string, BadgeTone>}
 */
const themingEnvOptions = {
  dev: 'positive',
  tst: 'caution',
  acc: 'critical',
  prd: 'primary'
}

function CurrentEnvBlock() {
  const { dataset: currentEnv } = useWorkspace()
  const [, tone = 'default'] = Object.entries(themingEnvOptions).find(([env]) => currentEnv.startsWith(env)) || []

  return (
    <Badge radius={0} padding={3} fontSize={1} {...{ tone }}>
      Using the <b>{currentEnv}</b> dataset
    </Badge>
  )
}

function ContextSwitch({ defaultValue, options, profileKey, schemaType, clientConfig, reportError }) {
  const [profileContextValue, setProfileContextValue] = useProfileContextValue({
    defaultValue,
    options,
    profileKey,
    schemaType,
    clientConfig,
    reportError
  })

  const {
    icon: currentIcon,
    label: currentLabel = profileContextValue
  } = options?.find(x => x.id === profileContextValue) || {}

  return (
    <ToastProvider>
      <MenuButton
        id='menu-button-context-switch'
        popover={{ portal: true, animate: true, overflow: 'auto', preventOverflow: false }}
        button={<Button
          mode='bleed'
          tone='default'
          iconRight={ChevronDownIcon}
          icon={currentIcon}
          text={currentLabel}
          aria-label='Switch profile context'
        />}
        menu={(
          <Menu style={{ maxHeight: '80svh' }}>
            {options.map(({ id, label, icon }) => {
              const isActive = profileContextValue === id

              return (
                <MenuItem
                  key={`ContextSwitch-item__${id}`}
                  type='button'
                  paddingX={3}
                  paddingY={2}
                  text={label}
                  selected={isActive}
                  disabled={isActive}
                  onClick={() => setProfileContextValue({ value: id })}
                  {...{ icon }}
                />
              )
            })}
          </Menu>
        )}
      />
    </ToastProvider>
  )
}

function useProfileContextValue({ defaultValue, options, profileKey, schemaType, clientConfig, reportError }) {
  const toast = useToast()
  const documentStore = useDocumentStore()
  const currentUser = useCurrentUser()
  const { apiVersion } = clientConfig.sanity.clients.studio
  const client = useClient({ apiVersion })

  const profileContextValue = useObservable(
    React.useMemo(
      () =>
        documentStore
          .listenQuery(
            groq`*[_type == $schemaType && _id in $ids] | order(_updatedAt desc)[0]`,
            { ids: [`drafts.${schemaType}${currentUser.id}`, `${schemaType}${currentUser.id}`], schemaType },
            {}
          )
          .pipe(
            map(
              profile => profile?.[profileKey] || defaultValue
            ),
          ),
      [documentStore, defaultValue, profileKey, schemaType, currentUser.id],
    ),
    defaultValue,
  )

  async function setProfileContextValue({ value }) {
    const label = options?.find(x => x.id === value)?.label

    if (!label) {
      toast.push({ status: 'error', title: `Profile cannot be switched to ${value}` })
      return
    }

    toast.push({ status: 'info', title: `Switching profile to ${label}` })

    try {
      await client.createOrReplace({
        _id: `drafts.${schemaType}${currentUser.id}`,
        _type: schemaType,
        [profileKey]: value
      })

      toast.push({ status: 'success', title: `Successfully switched to ${label}` })
    } catch (err) {
      toast.push({ status: 'error', title: `Failed switching to ${label}` })
      reportError(err)
    }
  }

  return [profileContextValue, setProfileContextValue]
}
