import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/client/components/FormDialog";
import { useAppForm } from "@/client/components/form/useAppForm";
import { QueryError } from "@/client/components/QueryState";
import { Button } from "@/client/components/ui/button";
import { updateLocalKeywords } from "@/serverFunctions/local-seo";
import { cleanKeywords, LocalKeywordFields } from "./LocalKeywordFields";

export function LocalKeywordsDialog({
  projectId,
  trackerId,
  keywords,
  onClose,
}: {
  projectId: string;
  trackerId: string;
  keywords: { keyword: string }[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (terms: string[]) =>
      updateLocalKeywords({ data: { projectId, trackerId, keywords: terms } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["localSeo", projectId],
      });
      onClose();
    },
  });
  const form = useAppForm({
    defaultValues: {
      keywords: keywords.length ? keywords.map((row) => row.keyword) : [""],
    },
    onSubmit: async ({ value }) => {
      await save.mutateAsync(cleanKeywords(value.keywords));
    },
  });
  return (
    <FormDialog
      title="管理关键词"
      onClose={onClose}
      actions={
        <>
          <Button variant="outline" disabled={save.isPending} onClick={onClose}>
            取消
          </Button>
          <Button type="submit" form="local-keywords" pending={save.isPending}>
            保存关键词
          </Button>
        </>
      }
    >
      <form.AppForm>
        <form.Form id="local-keywords" className="space-y-4">
          <form.Field name="keywords">
            {(field) => (
              <LocalKeywordFields
                value={field.state.value}
                onChange={field.handleChange}
                description="每次检查会在每个采样点搜索全部关键词。已移除关键词的结果会保留。"
              />
            )}
          </form.Field>
        </form.Form>
      </form.AppForm>
      {save.isError && (
        <QueryError
          error={save.error}
          fallback="无法保存这些关键词。"
        />
      )}
    </FormDialog>
  );
}
