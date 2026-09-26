import { useFetch, useRouter, useT, useUtil } from "~/hooks"
import { bus, fsDetailInfo, getFileSize, handleResp, pathJoin } from "~/utils"
import { createSignal, Match, onCleanup, Show, Switch } from "solid-js"
import {
  Button,
  createDisclosure,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
  Spinner,
} from "@hope-ui/solid"
import { FsDetailInfo, Obj } from "~/types"
import { password, selectedObjs } from "~/store"

const Field = (props: {
  label: string
  value: string
  onCopy?: () => void
  copyLabel?: string
}) => {
  return (
    <VStack spacing="$1" alignItems="flex-start" w="$full">
      <Text size="sm" fontWeight="$medium">
        {props.label}
      </Text>
      <HStack spacing="$2" w="$full" alignItems="stretch">
        <Textarea
          variant="filled"
          value={props.value}
          readonly
          rows={Math.min(4, Math.max(1, Math.ceil(props.value.length / 48)))}
          flex="1"
          minW="0"
        />
        <Show when={props.onCopy}>
          <Button colorScheme="neutral" flexShrink={0} onClick={props.onCopy}>
            {props.copyLabel}
          </Button>
        </Show>
      </HStack>
    </VStack>
  )
}

export const DetailInfo = () => {
  const t = useT()
  const { pathname } = useRouter()
  const { copy } = useUtil()
  const { isOpen, onOpen, onClose } = createDisclosure()
  const [info, setInfo] = createSignal<FsDetailInfo>()
  const [obj, setObj] = createSignal<Obj>()
  const [loading, fetchDetailInfo] = useFetch(fsDetailInfo)

  const handler = async (name: string) => {
    if (name !== "detail_info") return
    const objs = selectedObjs()
    if (objs.length !== 1) return
    setInfo(undefined)
    setObj(objs[0])
    onOpen()
    const path = pathJoin(pathname(), objs[0].name)
    const resp = await fetchDetailInfo(path, password())
    handleResp(
      resp,
      (data) => setInfo(data),
      () => onClose(),
    )
  }

  bus.on("tool", handler)
  onCleanup(() => {
    bus.off("tool", handler)
  })

  return (
    <Modal
      blockScrollOnMount={false}
      opened={isOpen()}
      onClose={onClose}
      size={{
        "@initial": "xs",
        "@md": "md",
        "@lg": "lg",
      }}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t("home.toolbar.detail_info")}</ModalHeader>
        <ModalBody>
          <Switch>
            <Match when={loading()}>
              <Spinner />
            </Match>
            <Match when={info()}>
              <VStack spacing="$3" alignItems="flex-start" w="$full">
                <Field
                  label={t("home.toolbar.driver")}
                  value={info()!.driver || "-"}
                />
                <Field
                  label={t("home.toolbar.virtual_path")}
                  value={info()!.virtual_path || "-"}
                />
                <Show
                  when={info()!.raw_path}
                  fallback={
                    <VStack spacing="$1" alignItems="flex-start" w="$full">
                      <Text size="sm" fontWeight="$medium">
                        {t("home.toolbar.raw_path")}
                      </Text>
                      <Text color="$neutral10">
                        {t("home.toolbar.raw_path_unavailable")}
                      </Text>
                    </VStack>
                  }
                >
                  <Field
                    label={t("home.toolbar.raw_path")}
                    value={info()!.raw_path!}
                    copyLabel={t("global.copy")}
                    onCopy={() => copy(info()!.raw_path!)}
                  />
                </Show>
                <Field
                  label={t("home.obj.size")}
                  value={getFileSize(obj()?.size ?? 0)}
                />
                <Show when={info()!.raw_id}>
                  <Field
                    label={t("home.toolbar.raw_id")}
                    value={info()!.raw_id!}
                    copyLabel={t("global.copy")}
                    onCopy={() => copy(info()!.raw_id!)}
                  />
                </Show>
              </VStack>
            </Match>
          </Switch>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="neutral" onClick={onClose}>
            {t("global.close")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
