import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { Recordable } from '@vben/types';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $te } from '@vben/locales';
import { setupVbenVxeTable, useVbenVxeGrid } from '@vben/plugins/vxe-table';
import { get, isFunction, isString } from '@vben/utils';

import { objectOmit } from '@vueuse/core';
import { Button, Image, Popconfirm, Switch, Tag } from 'ant-design-vue';

import { $t } from '#/locales';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        minHeight: 180,
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: '',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        return h(Image, { src: row[column.field] });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          Button,
          { size: 'small', type: 'link' },
          { default: () => props?.text },
        );
      },
    });

    // 单元格渲染：Tag
    vxeUI.renderer.add('CellTag', {
      renderTableDefault({ options, props }, { column, row }) {
        const value = get(row, column.field);
        const tagOptions = options ?? [
          { color: 'success', label: $t('common.enabled'), value: 1 },
          { color: 'error', label: $t('common.disabled'), value: 0 },
        ];
        const tagItem = tagOptions.find((item) => item.value === value);
        return h(
          Tag,
          {
            ...props,
            ...objectOmit(tagItem ?? {}, ['label']),
          },
          { default: () => tagItem?.label ?? value },
        );
      },
    });

    // 单元格渲染器：Switch
    vxeUI.renderer.add('CellSwitch', {
      renderTableDefault({ attrs, props }, { column, row }) {
        const loadingKey = `__loading_${column.field}`;
        const finallyProps = {
          checkedChildren: $t('common.enabled'),
          checkedValue: props?.checkedValue || 1,
          unCheckedChildren: $t('common.disabled'),
          unCheckedValue: props?.unCheckedValue || 0,
          ...props,
          checked: row[column.field],
          loading: row[loadingKey] ?? false,
          'onUpdate:checked': onChange,
        };
        async function onChange(newVal: any) {
          row[loadingKey] = true;
          try {
            const result = await attrs?.beforeChange?.(newVal, row);
            if (result !== false) {
              row[column.field] = newVal;
              attrs?.onChange?.({ row });
            }
          } finally {
            row[loadingKey] = false;
          }
        }
        return h(Switch, finallyProps);
      },
    });

    // 注册表格的操作按钮渲染器
    vxeUI.renderer.add('CellOperation', {
      renderTableDefault({ attrs, options, props }, { column, row }) {
        const defaultProps = { size: 'small', type: 'link', ...props };
        let align = 'end';
        switch (column.align) {
          case 'center': {
            align = 'center';
            break;
          }
          case 'left': {
            align = 'start';
            break;
          }
          default: {
            align = 'end';
            break;
          }
        }
        const presets: Recordable<Recordable<any>> = {
          delete: {
            danger: true,
            text: $t('common.delete'),
          },
          edit: {
            text: $t('common.edit'),
          },
        };
        const operations: Array<Recordable<any>> = (
          options || ['edit', 'delete']
        )
          .map((opt) => {
            if (isString(opt)) {
              return presets[opt]
                ? { code: opt, ...presets[opt], ...defaultProps }
                : {
                    code: opt,
                    text: $te(`common.${opt}`) ? $t(`common.${opt}`) : opt,
                    ...defaultProps,
                  };
            } else {
              return { ...defaultProps, ...presets[opt.code], ...opt };
            }
          })
          .map((opt) => {
            const optBtn: Recordable<any> = {};
            Object.keys(opt).forEach((key) => {
              optBtn[key] = isFunction(opt[key]) ? opt[key](row) : opt[key];
            });
            return optBtn;
          })
          .filter((opt) => opt.show !== false);

        function renderBtn(opt: Recordable<any>, listen = true) {
          return h(
            Button,
            {
              ...props,
              ...opt,
              icon: undefined,
              onClick: listen
                ? () =>
                    attrs?.onClick?.({
                      code: opt.code,
                      row,
                    })
                : undefined,
            },
            {
              default: () => {
                const content = [];
                if (opt.icon) {
                  content.push(
                    h(IconifyIcon, { class: 'size-5', icon: opt.icon }),
                  );
                }
                content.push(opt.text);
                return content;
              },
            },
          );
        }

        function renderConfirm(opt: Recordable<any>) {
          return h(
            Popconfirm,
            {
              getPopupContainer(el) {
                if (el.closest('.fixed-right--wrapper')) {
                  return document.body;
                }
                return (
                  el
                    .closest('.vxe-table--viewport-wrapper')
                    ?.querySelector('.vxe-table--main-wrapper')
                    ?.querySelector('tbody') || document.body
                );
              },
              placement: 'topLeft',
              title: $t('ui.actionTitle.delete', [attrs?.nameTitle || '']),
              ...props,
              ...opt,
              icon: undefined,
              onConfirm: () => {
                attrs?.onClick?.({
                  code: opt.code,
                  row,
                });
              },
            },
            {
              default: () => renderBtn({ ...opt }, false),
              description: () =>
                h(
                  'div',
                  { class: 'truncate' },
                  $t('ui.actionMessage.deleteConfirm', [
                    row[attrs?.nameField || 'name'],
                  ]),
                ),
            },
          );
        }

        const btns = operations.map((opt) =>
          opt.code === 'delete' ? renderConfirm(opt) : renderBtn(opt),
        );
        return h(
          'div',
          {
            class: 'flex table-operations',
            style: { justifyContent: align },
          },
          btns,
        );
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useVbenForm,
});

export { useVbenVxeGrid };

export type OnActionClickParams<T = Recordable<any>> = {
  code: string;
  row: T;
};

export type OnActionClickFn<T = Recordable<any>> = (
  params: OnActionClickParams<T>,
) => void;

export type * from '@vben/plugins/vxe-table';
