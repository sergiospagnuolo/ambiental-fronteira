SELECT strftime('%Y', data_infracao) as ano,sum(valor_multa) from multas
group by ano
order by ano ASC
